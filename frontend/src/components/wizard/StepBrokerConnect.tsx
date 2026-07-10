import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BrokerConnectionSchema, type BrokerConnection } from '@fin/shared';
import { api, ApiError } from '../../api/client';

interface Props {
  data: BrokerConnection | undefined;
  onUpdate: (data: BrokerConnection) => void;
  onNext: () => void;
}

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export default function StepBrokerConnect({ data, onUpdate, onNext }: Props) {
  const [showSecret, setShowSecret] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');

  const defaultValues: BrokerConnection = data ?? { apiKey: '', apiSecret: '', paperTrading: true };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<BrokerConnection>({
    resolver: zodResolver(BrokerConnectionSchema),
    defaultValues,
    mode: 'onChange',
  });

  const paperTrading = watch('paperTrading');

  const onSubmit = () => {
    // form already validated via zodResolver, get values manually
    const apiKey = (document.getElementById('apiKey') as HTMLInputElement).value;
    const apiSecret = (document.getElementById('apiSecret') as HTMLInputElement).value;
    onUpdate({ apiKey, apiSecret, paperTrading: paperTrading ?? true });
    onNext();
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    const apiKey = (document.getElementById('apiKey') as HTMLInputElement).value;
    const apiSecret = (document.getElementById('apiSecret') as HTMLInputElement).value;

    try {
      await api('/integrations/alpaca/test', {
        method: 'POST',
        body: JSON.stringify({
          apiKey,
          apiSecret,
          paperTrading: paperTrading ?? true,
        }),
      });
      setConnectionStatus('success');
      setTimeout(() => setConnectionStatus('idle'), 4000);
    } catch (err) {
      setConnectionStatus('error');
      // Keep error visible for a bit, then reset
      setTimeout(() => setConnectionStatus('idle'), 6000);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="wizard-step">
      <div className="wizard-step__content">
        <h2 className="wizard-step__title">Connect Your Broker</h2>
        <p className="wizard-step__subtitle">
          Link your Alpaca Markets account to get started with real or paper trading.
        </p>

        <div className="wizard-field">
          <label htmlFor="apiKey">API Key</label>
          <input
            id="apiKey"
            type="text"
            {...register('apiKey')}
            placeholder="PK..."
            spellCheck={false}
            autoComplete="off"
          />
          {errors.apiKey && <span className="wizard-field__error">{errors.apiKey.message}</span>}
        </div>

        <div className="wizard-field">
          <label htmlFor="apiSecret">API Secret</label>
          <div className="wizard-field__password">
            <input
              id="apiSecret"
              type={showSecret ? 'text' : 'password'}
              {...register('apiSecret')}
              placeholder="••••••••••••••••"
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="button"
              className="wizard-toggle-vis"
              onClick={() => setShowSecret((v) => !v)}
              aria-label={showSecret ? 'Hide secret' : 'Show secret'}
            >
              {showSecret ? '🙈' : '👁'}
            </button>
          </div>
          {errors.apiSecret && <span className="wizard-field__error">{errors.apiSecret.message}</span>}
        </div>

        <div className="wizard-field wizard-field--toggle">
          <label className="wizard-toggle">
            <input type="checkbox" {...register('paperTrading')} />
            <span className="wizard-toggle__slider" />
            <span className="wizard-toggle__label">
              Paper Trading
              <small>Trade with simulated money before going live</small>
            </span>
          </label>
        </div>

        <div className="wizard-test-connection">
          <button
            type="button"
            className="wizard-btn wizard-btn--secondary"
            onClick={testConnection}
            disabled={connectionStatus === 'testing' || !isValid}
          >
            {connectionStatus === 'testing' ? (
              <span className="wizard-spinner" />
            ) : connectionStatus === 'success' ? (
              '✓ Connected'
            ) : connectionStatus === 'error' ? (
              '✗ Connection Failed'
            ) : (
              'Test Connection'
            )}
          </button>
          {connectionStatus === 'success' && (
            <span className="wizard-connection-status wizard-connection-status--success">
              ✓ Connected successfully
            </span>
          )}
          {connectionStatus === 'error' && (
            <span className="wizard-connection-status wizard-connection-status--error">
              ✗ Connection failed. Check your credentials and try again.
            </span>
          )}
        </div>
      </div>

      <div className="wizard-step__actions">
        <button
          type="submit"
          className="wizard-btn wizard-btn--primary"
          disabled={!isValid}
        >
          Next: Risk Profile →
        </button>
      </div>
    </form>
  );
}