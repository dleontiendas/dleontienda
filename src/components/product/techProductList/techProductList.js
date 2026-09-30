import React from "react";
import DynamicCategoryProductList from "../dynamicCategory/DynamicCategoryProductList";
import { TECHNOLOGY_CATEGORY_CONFIG } from "./technologyDepartment";

export default function TechProductList() {
  return <DynamicCategoryProductList config={TECHNOLOGY_CATEGORY_CONFIG} />;
}
