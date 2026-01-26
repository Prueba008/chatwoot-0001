# frozen_string_literal: true

class Webhooks::Tiendanube::OrdersController < ActionController::API
  # Si querés validar firma/token, agregalo acá:
  # before_action :verify_webhook

  def create
    store_id = params[:store_id].to_s
    payload  = parse_json(request.raw_post)

    event = payload['event'] || payload['type'] || 'order/event'
    data  = payload['data'] || {}
    order = data['order'] || data # tolerante

    Rails.logger.info("[Tiendanube][Orders] event=#{event} store_id=#{store_id}")

    account = resolve_account(store_id)
    inbox   = resolve_inbox(account)

    contact = upsert_contact_from_order(account, order)
    conversation = find_or_create_conversation(account, inbox, contact)

    content = format_order_note(event, order)

    Messages::MessageBuilder.new(
      user: nil,
      conversation: conversation,
      params: {
        content: content,
        message_type: :outgoing, # nota interna/outgoing en Chatwoot
        private: true
      }
    ).perform

    head :ok
  rescue ActiveRecord::RecordNotFound
    head :not_found
  rescue => e
    Rails.logger.error("[Tiendanube][Orders] #{e.class}: #{e.message}")
    head :unprocessable_entity
  end

  private

  def parse_json(raw)
    JSON.parse(raw.presence || '{}')
  rescue JSON::ParserError
    {}
  end

  def resolve_account(store_id)
    # Estrategia simple para MVP:
    # - usa Account con nombre "Tienda <store_id>"
    # Alternativa mejor: mapear store_id en un modelo Channel::Tiendanube.
    Account.find_by!(name: "Tienda #{store_id}")
  end

  def resolve_inbox(account)
    account.inboxes.find_by(name: 'Tiendanube') || account.inboxes.first!
  end

  def upsert_contact_from_order(account, order)
    customer = order['customer'] || {}
    email = customer['email'].presence || "tiendanube_#{customer['id']}@no-email.local"
    name  = customer['name'].presence || [customer['first_name'], customer['last_name']].compact.join(' ')
    phone = customer['phone'] || customer['phone_number']

    Contact.find_or_initialize_by(account_id: account.id, email: email).tap do |c|
      c.name = name if name.present?
      c.phone_number = phone if phone.present?
      c.custom_attributes ||= {}
      c.custom_attributes.merge!(
        'tiendanube_store_id' => order['store_id'],
        'tiendanube_customer_id' => customer['id'],
        'orders_count' => customer['orders_count'],
        'total_spent' => customer['total_spent']
      ).compact
      c.save!
    end
  end

  def find_or_create_conversation(account, inbox, contact)
    Conversation.find_or_create_by!(
      account_id: account.id,
      inbox_id: inbox.id,
      contact_id: contact.id
    )
  end

  def format_order_note(event, order)
    items = (order['line_items'] || []).map do |i|
      "- #{i['name'] || i['title']} x#{i['quantity']} (sku: #{i['sku'] || '-'})"
    end.join("\n")

    <<~TXT.strip
      🛒 Tiendanube - Evento: #{event}
      Pedido: #{order['number'] || order['id'] || '-'}
      Estado: #{order['financial_status'] || order['status'] || '-'}
      Total: #{order['total'] || order['total_price'] || '-'}
      Items:
      #{items.presence || '- (sin items)'}
    TXT
  end
end
