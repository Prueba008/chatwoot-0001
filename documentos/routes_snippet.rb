# === Tiendanube Integration (ADD THIS) ===
# 1) Endpoint interno autenticado (Dashboard):
namespace :api do
  namespace :v1 do
    namespace :integrations do
      namespace :tiendanube do
        resources :products, only: [:index]
      end
    end
  end
end

# 2) Webhooks externos (Tiendanube -> Chatwoot):
namespace :webhooks do
  namespace :tiendanube do
    post ':store_id/orders', to: 'orders#create'
    post ':store_id/customers', to: 'customers#create'
  end
end
