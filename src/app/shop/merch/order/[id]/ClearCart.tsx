"use client";

import { useEffect } from "react";
import { writeCart } from "../../cart";

/** The order exists, so the cart in this browser has done its job. */
export function ClearCart() {
  useEffect(() => writeCart([]), []);
  return null;
}
