"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";

export default function EditProductPage() {
  const params = useParams();
  const idParam = params?.id;
  const productId = typeof idParam === "string" ? parseInt(idParam, 10) : parseInt((idParam as string[])[0], 10);

  return <ProductForm mode="edit" productId={productId} />;
}

