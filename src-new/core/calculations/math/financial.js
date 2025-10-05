// Financial mathematical operations
// Pure functions for financial calculations

import { toNumber, divide, multiply, subtract, add, round } from './basic.js';

/**
 * Currency and money calculations
 */
export const formatCurrency = (amount, decimals = 2) => {
  const num = toNumber(amount);
  return `$${round(num, decimals).toFixed(decimals)}`;
};

export const parseCurrency = (currencyString) => {
  if (typeof currencyString !== 'string') return toNumber(currencyString);
  return toNumber(currencyString.replace(/[$,]/g, ''));
};

/**
 * Discount and markup calculations
 */
export const discountAmount = (originalPrice, discountPercent) => {
  return multiply(toNumber(originalPrice), divide(toNumber(discountPercent), 100));
};

export const discountedPrice = (originalPrice, discountPercent) => {
  return subtract(toNumber(originalPrice), discountAmount(originalPrice, discountPercent));
};

export const markupAmount = (cost, markupPercent) => {
  return multiply(toNumber(cost), divide(toNumber(markupPercent), 100));
};

export const markupPrice = (cost, markupPercent) => {
  return add(toNumber(cost), markupAmount(cost, markupPercent));
};

/**
 * Margin calculations
 */
export const grossMargin = (revenue, cost) => {
  return subtract(toNumber(revenue), toNumber(cost));
};

export const marginPercent = (revenue, cost) => {
  const rev = toNumber(revenue);
  return rev !== 0 ? divide(grossMargin(revenue, cost), rev) * 100 : 0;
};

export const markupPercent = (revenue, cost) => {
  const c = toNumber(cost);
  return c !== 0 ? divide(grossMargin(revenue, cost), c) * 100 : 0;
};

/**
 * Tax calculations
 */
export const taxAmount = (subtotal, taxRate) => {
  return multiply(toNumber(subtotal), divide(toNumber(taxRate), 100));
};

export const totalWithTax = (subtotal, taxRate) => {
  return add(toNumber(subtotal), taxAmount(subtotal, taxRate));
};

export const subtotalFromTotal = (total, taxRate) => {
  const rate = divide(toNumber(taxRate), 100);
  return divide(toNumber(total), add(1, rate));
};

/**
 * Unit economics
 */
export const unitPrice = (totalAmount, quantity) => {
  const qty = toNumber(quantity);
  return qty !== 0 ? divide(toNumber(totalAmount), qty) : 0;
};

export const totalAmount = (unitPrice, quantity) => {
  return multiply(toNumber(unitPrice), toNumber(quantity));
};

/**
 * Rate and ratio calculations
 */
export const conversionRate = (conversions, opportunities) => {
  const opp = toNumber(opportunities);
  return opp !== 0 ? divide(toNumber(conversions), opp) * 100 : 0;
};

export const averageOrderValue = (totalRevenue, orderCount) => {
  const orders = toNumber(orderCount);
  return orders !== 0 ? divide(toNumber(totalRevenue), orders) : 0;
};

export const unitsPerTransaction = (totalUnits, transactionCount) => {
  const transactions = toNumber(transactionCount);
  return transactions !== 0 ? divide(toNumber(totalUnits), transactions) : 0;
};