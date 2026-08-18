/** Shared copy from the owner's policy & good-to-know documents (Aug 2026). */

export const MENU_CATEGORIES = [
  "Signature",
  "Bites",
  "Loaves",
  "Cakes",
  "Hampers",
  "Add-ons",
  "Limited Editions",
] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number];

export const POLICY_SECTIONS = [
  {
    id: "cancellation",
    title: "Cancellation Policy",
    items: [
      "All products are freshly baked and prepared specifically for each order.",
      "Orders cannot be cancelled once payment has been completed and the order has been confirmed.",
      "Cancellation requests after payment cannot be accommodated.",
    ],
  },
  {
    id: "refund",
    title: "Refund Policy",
    items: [
      "All Little Brownie Co. products are freshly baked and prepared specifically for each order.",
      "No refunds will be provided once an order has been placed and payment has been completed.",
      "Refund requests will not be accepted after payment confirmation.",
      "By completing the payment, the customer acknowledges and agrees to the no-refund policy.",
    ],
  },
  {
    id: "modification",
    title: "Order Modification Policy",
    items: [
      "Order modifications can be made up to 5:00 PM on the day before the scheduled delivery date.",
      "Modification requests received after 5:00 PM on the previous day of delivery will not be accepted.",
      "Modifications are subject to product availability and feasibility.",
      "Any change in the order value or delivery charges will be communicated to the customer.",
      "Any additional amount resulting from the modification must be paid before the modified order is confirmed.",
    ],
  },
  {
    id: "delivery",
    title: "Delivery Policy",
    items: [
      "We currently offer delivery within Bangalore only.",
      "Pick-up is not available. All orders will be delivered to the address provided at checkout.",
      "Deliveries are arranged through third-party partners such as Uber, Porter and Rapido.",
      "We compare the available delivery options and choose the most suitable option based on availability and delivery charges.",
      "Delivery charges are separate from the order amount and will be communicated before dispatch.",
      "Delivery charges can be paid directly to the delivery partner upon receiving the order, as communicated at the time of dispatch.",
      "Once your order is dispatched, we will share the tracking details, wherever available.",
      "Please ensure that your delivery address and contact number are accurate and reachable.",
      "We are not responsible for delays caused by traffic, weather, road conditions or delivery partners.",
      "If you are unavailable or unreachable at the time of delivery, any additional delivery or re-delivery charges will be borne by you.",
    ],
  },
] as const;

export const GOOD_TO_KNOW = {
  allergy: {
    title: "Allergy Information",
    items: [
      "Contains eggs, milk/dairy and wheat (gluten).",
      "Soy may be present in our chocolate and Nutella-based products.",
      "Hazelnuts are present in Nutella-based products.",
      "Walnuts are present in our Walnut flavour.",
      "Our products are prepared in a kitchen that handles these ingredients, so cross-contact with allergens is possible.",
      "We cannot guarantee that our products are completely free from traces of allergens.",
      "If you have a food allergy or dietary restriction, please review this information before placing your order.",
    ],
  },
  storage: {
    title: "Storage & Serving",
    items: [
      "Best enjoyed warm: Microwave for 10–15 seconds for a warm, gooey texture.",
      "Best enjoyed with: Ice cream, whipped cream, fresh berries or chocolate sauce.",
      "Store in an airtight container at room temperature for up to 4 days.",
      "Refrigerate in an airtight container for up to 7 days.",
      "If refrigerated, bring to room temperature or microwave for 10–15 seconds before serving.",
      "Our brownies are soft and fudgy, so handle them gently.",
    ],
  },
} as const;

export const DELIVERY_AGREEMENT_TEXT =
  "Delivery charges are calculated separately based on distance. We use Uber, Porter or Rapido and will book the cheapest available option. The delivery charges and tracking details will be shared once your order is dispatched. Delivery charges are payable directly to the delivery partner upon receiving your order.";

export const FAQ_ITEMS = [
  {
    q: "Do you offer same-day delivery?",
    a: "No. Orders placed between 9:00 AM and 5:00 PM can be scheduled from the next day onwards. Orders placed after 5:00 PM (or before 9:00 AM) can be scheduled from the day after next onwards.",
  },
  {
    q: "Which areas do you deliver to?",
    a: "We deliver within Bangalore only. Pick-up is not available — all orders are delivered to the address you provide at checkout.",
  },
  {
    q: "How are delivery charges calculated?",
    a: "Delivery charges are calculated separately based on distance. We use Uber, Porter or Rapido and book the cheapest available option. Charges and tracking details are shared once your order is dispatched, and are payable directly to the delivery partner when you receive your order.",
  },
  {
    q: "Can I cancel my order?",
    a: "Orders cannot be cancelled once payment has been completed and the order has been confirmed, as every product is freshly baked for your order.",
  },
  {
    q: "Can I modify my order after placing it?",
    a: "Yes, up to 5:00 PM on the day before your scheduled delivery date. Message us on WhatsApp with your order details. Modifications after that cutoff cannot be accepted.",
  },
  {
    q: "What is your refund policy?",
    a: "No refunds are provided once an order has been placed and payment completed, as all products are made fresh to order. By completing payment, you acknowledge and agree to this policy.",
  },
  {
    q: "How should I store my brownies?",
    a: "Store in an airtight container at room temperature for up to 4 days, or refrigerate for up to 7 days. Microwave for 10–15 seconds before serving for a warm, gooey texture.",
  },
  {
    q: "Do your brownies contain allergens?",
    a: "Yes — they contain eggs, milk/dairy and wheat (gluten). Soy, hazelnuts and walnuts may also be present depending on the flavour. Our kitchen handles these ingredients, so cross-contact is possible. See our Good to Know page for full details.",
  },
] as const;
