import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, DotsThree, Info, Minus, X } from 'phosphor-react';

import { useAuth } from '@octap/shared/authentication';

import type { ChangeRequest } from '../types';
import { Button, Modal } from '@octap/shared/components';
import { cn } from '@octap/shared/utils';

export function ChangeRequestActions({ request }: { request: ChangeRequest }) {
  const { api: client } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [action, setAction] = useState<'APPROVE' | 'REJECT' | null>(null);

  const reviewMutation = useMutation({
    mutationFn: async (input: { action: 'APPROVE' | 'REJECT'; reason: string }) => {
      if (!input.reason) {
        throw new Error('Please enter a reason for this decision!');
      }

      const response =
        input.action === 'APPROVE'
          ? await client.platform.approve({ id: request.id, body: { reason: input.reason } })
          : await client.platform.reject({ id: request.id, body: { reason: input.reason } });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: async () => {
      setIsOpen(false);
      setMessage('');
      setAction(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['requests', 'change-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['partners', 'change-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['partners', 'organizations'] }),
        ...(request.organizationId
          ? [
              queryClient.invalidateQueries({
                queryKey: ['partners', 'organization', request.organizationId],
              }),
            ]
          : []),
      ]);
    },
  });

  const closeModal = () => {
    if (reviewMutation.isPending) return;
    setIsOpen(false);
    setMessage('');
    setAction(null);
    reviewMutation.reset();
  };

  return (
    <>
      <Button
        type="button"
        icon={DotsThree}
        className="btn-sm btn-outline"
        disabled={request.status !== 'PENDING'}
        onClick={() => {
          reviewMutation.reset();
          setMessage('');
          setIsOpen(true);
        }}
      >
        Actions
      </Button>

      <Modal
        open={isOpen}
        onOpenChange={(open) => !open && closeModal()}
        title="Review change request"
        description={
          <>
            {request.requestType.replaceAll('_', ' ')}
            {request.organizationName ? ` for ${request.organizationName}` : ''}. Add a message for
            your decision.
          </>
        }
        footer={
          <div className="flex w-full flex-col gap-2">
            {action ? (
              <Button
                type="button"
                className={cn('btn-soft', action === 'APPROVE' ? 'btn-success' : 'btn-error')}
                disabled={reviewMutation.isPending}
                icon={action === 'APPROVE' ? Check : X}
                loading={reviewMutation.isPending}
                onClick={() => {
                  reviewMutation.mutate({ action, reason: message.trim() });
                }}
              >
                Confirm {action.toLowerCase()}
              </Button>
            ) : (
              <div className="alert alert-soft alert-warning justify-between">
                Please select an option
                <Info size="1.5em" />
              </div>
            )}

            <Button
              type="button"
              className="btn-ghost"
              disabled={reviewMutation.isPending}
              onClick={closeModal}
              icon={Minus}
            >
              Cancel
            </Button>
          </div>
        }
      >
        <div aria-busy={reviewMutation.isPending}>
          <div className="form-control mt-4 w-full">
            <span className="label-text mb-2 font-medium">Request action</span>

            <div className="flex *:flex-1 gap-2">
              <Button
                type="button"
                className={cn('btn-error', { 'btn-soft': action !== 'REJECT' })}
                icon={X}
                onClick={() => setAction('REJECT')}
              >
                Reject
              </Button>
              <Button
                type="button"
                className={cn('btn-success', { 'btn-soft': action !== 'APPROVE' })}
                icon={Check}
                onClick={() => setAction('APPROVE')}
              >
                Approve
              </Button>
            </div>
          </div>

          <label className="form-control mt-4 w-full">
            <span className="label-text mb-2 font-medium">Message / Reason</span>
            <textarea
              className="textarea textarea-bordered min-h-24 w-full block"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={reviewMutation.isPending}
              maxLength={1000}
              placeholder="Explain the decision"
            />
          </label>

          {reviewMutation.isError && (
            <div className="alert alert-error mt-4" role="alert">
              {reviewMutation.error instanceof Error
                ? reviewMutation.error.message
                : 'Could not review this request. Please try again.'}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
