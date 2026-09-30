import React from "react";
import DynamicCategoryProductList from "../dynamicCategory/DynamicCategoryProductList";
import { DAMA_CATEGORY_CONFIG } from "./damaDepartment";

export default function DamaProductList() {
  return <DynamicCategoryProductList config={DAMA_CATEGORY_CONFIG} />;
}
