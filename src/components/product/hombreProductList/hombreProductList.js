import React from "react";
import DynamicCategoryProductList from "../dynamicCategory/DynamicCategoryProductList";
import { HOMBRE_CATEGORY_CONFIG } from "./hombreDepartment";

export default function HombreProductList() {
  return <DynamicCategoryProductList config={HOMBRE_CATEGORY_CONFIG} />;
}
