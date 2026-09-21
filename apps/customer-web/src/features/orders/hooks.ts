import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { marketplaceApi } from '../../api';
import type { CancelOrderItemInput, CreateReturnInput, CreateReviewInput, OrderQuery } from '../../api/types';

export const orderKeys = {
  all: ['customer-orders'] as const,
  list: (query: OrderQuery) => [...orderKeys.all, 'list', query] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
  tracking: (id: string) => [...orderKeys.all, 'tracking', id] as const,
};

export function useOrders(query: OrderQuery = {}) {
  return useQuery({ queryKey: orderKeys.list(query), queryFn: () => marketplaceApi.getOrders(query) });
}

export function useOrder(orderId: string) {
  return useQuery({ queryKey: orderKeys.detail(orderId), queryFn: () => marketplaceApi.getOrder(orderId), enabled: Boolean(orderId) });
}

export function useShipmentTracking(shipmentId: string) {
  return useQuery({ queryKey: orderKeys.tracking(shipmentId), queryFn: () => marketplaceApi.getShipmentTracking(shipmentId), enabled: Boolean(shipmentId) });
}

export function useCancelOrderItem(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: CancelOrderItemInput }) => marketplaceApi.cancelOrderItem(orderId, itemId, input),
    onSuccess: (order) => { queryClient.setQueryData(orderKeys.detail(orderId), order); void queryClient.invalidateQueries({ queryKey: orderKeys.all }); },
  });
}

export function useCreateReturn(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: CreateReturnInput }) => marketplaceApi.createReturn(orderId, itemId, input),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) }); void queryClient.invalidateQueries({ queryKey: orderKeys.all }); },
  });
}

export function useCreateReview(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: CreateReviewInput }) => marketplaceApi.createReview(productId, input),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) }); },
  });
}
