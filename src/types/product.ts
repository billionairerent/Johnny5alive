export interface ProductSpec {
  spec: string;
  value: string;
}

export interface ProductFeature {
  title: string;
  description: string;
}

export interface Product {
  sku: string;
  name: string;
  tagline: string;
  description: string;
  specs: ProductSpec[];
  features: ProductFeature[];
  inBox: string[];
}
