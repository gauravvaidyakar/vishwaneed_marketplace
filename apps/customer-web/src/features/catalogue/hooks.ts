import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { marketplaceApi } from '../../api';
import type { ProductQuery } from '../../api/types';

export const catalogueKeys = {
  categories: ['categories'] as const,
  products: (query: ProductQuery) => ['products', query] as const,
  product: (idOrSlug: string) => ['product', idOrSlug] as const,
};

export function useCategories() {
  return useQuery({ queryKey: catalogueKeys.categories, queryFn: () => marketplaceApi.getCategories(), staleTime: 10 * 60 * 1000 });
}

export function useProducts(query: ProductQuery) {
  return useQuery({ queryKey: catalogueKeys.products(query), queryFn: () => marketplaceApi.getProducts(query), placeholderData: keepPreviousData });
}

export function useProduct(idOrSlug: string) {
  return useQuery({ queryKey: catalogueKeys.product(idOrSlug), queryFn: () => marketplaceApi.getProduct(idOrSlug), enabled: Boolean(idOrSlug) });
}
