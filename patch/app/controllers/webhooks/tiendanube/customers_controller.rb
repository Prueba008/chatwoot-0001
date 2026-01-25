# frozen_string_literal: true

class Webhooks::Tiendanube::CustomersController < ActionController::API
  def create
    store_id = params[:store_id].to_s
    payload  = parse_json(request.raw_post)

    event = payload['event'] || payload['type'] || 'customer/event'
    data  = payload['data'] || {}
    customer = data['customer'] || data

    Rails.logger.info("[Tiendanube][Customers] event=#{event} store_id=#{store_id}")

    account = Account.find_by!(name: "Tienda #{store_id}")

    email = customer['email'].presence || "tiendanube_#{customer['id']}@no-email.local"
    name  = customer['name'].presence || [customer['first_name'], customer['last_name']].compact.join(' ')
    phone = customer['phone'] || customer['phone_number']

    contact = Contact.find_or_initialize_by(account_id: account.id, email: email)
    contact.name = name if name.present?
    contact.phone_number = phone if phone.present?
    contact.custom_attributes ||= {}
    contact.custom_attributes.merge!(
      'tiendanube_store_id' => store_id,
      'tiendanube_customer_id' => customer['id'],
      'orders_count' => customer['orders_count'],
      'total_spent' => customer['total_spent'],
      'accepts_marketing' => customer['accepts_marketing']
    ).compact
    contact.save!

    head :ok
  rescue ActiveRecord::RecordNotFound
    head :not_found
  rescue => e
    Rails.logger.error("[Tiendanube][Customers] #{e.class}: #{e.message}")
    head :unprocessable_entity
  end

  private

  def parse_json(raw)
    JSON.parse(raw.presence || '{}')
  rescue JSON::ParserError
    {}
  end
end
