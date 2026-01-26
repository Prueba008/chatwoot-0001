# frozen_string_literal: true

require 'faraday'
require 'json'

module Tiendanube
  class Client
    BASE_URL = 'https://api.tiendanube.com/v1'.freeze

    def initialize(
      store_id: ENV.fetch('TIENDANUBE_STORE_ID'),
      access_token: ENV.fetch('TIENDANUBE_ACCESS_TOKEN'),
      user_agent: ENV.fetch('TIENDANUBE_USER_AGENT', 'app-chatwoot')
    )
      @store_id = store_id.to_s
      @access_token = access_token.to_s
      @user_agent = user_agent.to_s
    end

    def list_products(page: nil, per_page: nil, query: nil)
      params = {}
      params[:page] = page if page
      params[:per_page] = per_page if per_page
      params[:q] = query if query

      get("/#{@store_id}/products", params: params)
    end

    # Útil para webhooks / ampliaciones futuras
    def get_order(order_id)
      get("/#{@store_id}/orders/#{order_id}")
    end

    def get_customer(customer_id)
      get("/#{@store_id}/customers/#{customer_id}")
    end

    private

    def get(path, params: {})
      resp = connection.get(path, params)
      unless resp.status.between?(200, 299)
        raise "Tiendanube API error #{resp.status}: #{resp.body}"
      end
      resp
    end

    def connection
      @connection ||= Faraday.new(url: BASE_URL) do |f|
        f.request :url_encoded
        f.adapter Faraday.default_adapter
      end.tap do |c|
        # Importante: Tiendanube usa header "Authentication" (no Authorization)
        c.headers['Authentication'] = "bearer #{@access_token}"
        c.headers['User-Agent'] = @user_agent
        c.headers['Accept'] = 'application/json'
        c.options.timeout = 15
        c.options.open_timeout = 5
      end
    end
  end
end
