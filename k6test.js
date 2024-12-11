import http from 'k6/http';
import { sleep, check } from 'k6';

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp-up to 10 users over 1 minute
    { duration: '3m', target: 50 }, // Sustain 50 users for 3 minutes
    { duration: '1m', target: 0 },  // Ramp-down to 0 users over 1 minute
  ],
};

export default function () {
  const BASE_URL = 'http://localhost:4000'; // Replace with your backend URL

  // 1. Simulate a user logging in
  const loginPayload = JSON.stringify({
    email: 'user@example.com',
    password: '123456',
  });

  const loginHeaders = { 'Content-Type': 'application/json' };

  const loginRes = http.post(`${BASE_URL}/api/users/signin`, loginPayload, {
    headers: loginHeaders,
  });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
  });

  // Extract token from response
  const token = JSON.parse(loginRes.body).token;

  // 2. Simulate the user browsing products
  const productHeaders = { Authorization: `Bearer ${token}` };

  const productRes = http.get(`${BASE_URL}/api/products`, {
    headers: productHeaders,
  });

  check(productRes, {
    'product status is 200': (r) => r.status === 200,
    'products retrieved': (r) => r.json().length > 0,
  });

  // Select a random product
  const products = productRes.json();
  const randomProduct = products[Math.floor(Math.random() * products.length)];

  // 3. Simulate adding a product to the cart (creating an order)
  const orderPayload = JSON.stringify({
    orderItems: [
      {
        product: randomProduct._id,
        quantity: 1,
      },
    ],
    shippingAddress: {
      fullName: 'John Doe',
      address: '123 Main St',
      city: 'Test City',
      postalCode: '12345',
      country: 'Test Country',
    },
    paymentMethod: 'PayPal',
    itemsPrice: randomProduct.price,
    shippingPrice: 5.0,
    taxPrice: randomProduct.price * 0.1,
    totalPrice: randomProduct.price + 5.0 + randomProduct.price * 0.1,
  });

  const orderHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const addToCartRes = http.post(`${BASE_URL}/api/orders`, orderPayload, {
    headers: orderHeaders,
  });

  check(addToCartRes, {
    'order creation status is 201': (r) => r.status === 201,
  });

  // Simulate user waiting (think time)
  sleep(Math.random() * 5);
}
