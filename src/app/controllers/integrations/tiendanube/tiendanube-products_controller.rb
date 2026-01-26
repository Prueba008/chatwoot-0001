# frozen_string_literal: true

class Api::V1::Integrations::Tiendanube::ProductsController < Api::V1::BaseController
  # Este controller hereda autenticación del dashboard (Current.user)
  # y por lo tanto NO expone el token al frontend.

  def index
    client = ::Tiendanube::Client.new
    resp = client.list_products(
      page: params[:page],
      per_page: params[:per_page],
      query: params[:q]
    )
    render json: JSON.parse(resp.body)
  rescue KeyError => e
    render json: { error: 'missing_env', detail: e.message }, status: :unprocessable_entity
  rescue => e
    Rails.logger.error("[TiendanubeProducts] #{e.class}: #{e.message}")
    render json: { error: 'tiendanube_error', detail: e.message }, status: :bad_gateway
  end
end
