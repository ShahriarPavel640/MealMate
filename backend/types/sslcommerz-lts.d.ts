declare module 'sslcommerz-lts' {
  class SSLCommerzPayment {
    constructor(store_id: string, store_password: string, is_live: boolean);
    init(data: Record<string, unknown>): Promise<unknown>;
  }
  export default SSLCommerzPayment;
}
