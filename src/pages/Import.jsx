import { useState, useEffect } from 'react';
import {
  Steps, Card, Select, Button, Upload, Typography, Alert,
  Table, Tag, Space, Divider, App as AntdApp, Spin, Checkbox,
  Tooltip, Form, Input, InputNumber
} from 'antd';
import {
  UploadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, InboxOutlined, ReloadOutlined, StarOutlined,
  EditOutlined
} from '@ant-design/icons';
import { importService, accountService, watchlistService } from '../services/dashboard.service';
import { useAuth } from '../store/useAuth';
import { formatCurrency, formatPercent, formatDate, institutionName, gainLossColor } from '../utils/formatters';
import { brandColors } from '../theme';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

// =============================================================================
// Import History table columns
// =============================================================================
const historyColumns = [
  {
    title: 'File',
    dataIndex: 'filename',
    key: 'filename',
    ellipsis: true,
    render: (val) => <Text style={{ color: '#fff', fontSize: 13 }}>{val}</Text>,
  },
  {
    title: 'Institution',
    dataIndex: 'institution',
    key: 'institution',
    width: 140,
    render: (val) => <Tag color="default">{institutionName(val)}</Tag>,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 90,
    render: (val) => {
      const config = {
        success: { color: 'success', icon: <CheckCircleOutlined /> },
        partial: { color: 'warning', icon: <WarningOutlined /> },
        failed:  { color: 'error',   icon: <CloseCircleOutlined /> },
      };
      const { color, icon } = config[val] || config.failed;
      return <Tag color={color} icon={icon}>{val}</Tag>;
    },
  },
  {
    title: 'Imported',
    dataIndex: 'rows_imported',
    key: 'rows_imported',
    width: 90,
    align: 'right',
    render: (val) => <Text style={{ color: brandColors.textSecondary }}>{val} rows</Text>,
  },
  {
    title: 'As Of',
    dataIndex: 'as_of_date',
    key: 'as_of_date',
    width: 110,
    render: (val) => <Text style={{ color: brandColors.textSecondary }}>{formatDate(val)}</Text>,
  },
  {
    title: 'Date',
    dataIndex: 'imported_at',
    key: 'imported_at',
    width: 160,
    render: (val) => (
      <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
        {new Date(val).toLocaleString('en-US', {
          month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit'
        })}
      </Text>
    ),
  },
];

// =============================================================================
// Step 1 — Select Institution
// =============================================================================
const StepSelectInstitution = ({ importers, selectedImporter, onSelect, onNext }) => (
  <div style={{ maxWidth: 500 }}>
    <Text style={{ color: brandColors.textSecondary, display: 'block', marginBottom: 16 }}>
      Select the institution or entry method.
    </Text>

    <Select
      placeholder="Select institution / entry method"
      value={selectedImporter}
      onChange={onSelect}
      size="large"
      style={{ width: '100%', marginBottom: 24 }}
    >
      {importers.map(imp => (
        <Option key={imp.id} value={imp.id}>
          <Space>
            <Text style={{ color: '#fff' }}>{imp.name}</Text>
            {!imp.isManual && imp.fileTypes?.length > 0 && (
              <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
                ({imp.fileTypes.join(', ').toUpperCase()})
              </Text>
            )}
          </Space>
        </Option>
      ))}
    </Select>

    {selectedImporter && (
      <Alert
        type="info"
        style={{ marginBottom: 24 }}
        description={importers.find(i => i.id === selectedImporter)?.description}
      />
    )}

    <Button
      type="primary"
      size="large"
      disabled={!selectedImporter}
      onClick={onNext}
      style={{ fontWeight: 600 }}
    >
      Next
    </Button>
  </div>
);

// =============================================================================
// Step 2a — File Upload (for file-based importers)
// =============================================================================
const StepUploadFile = ({
  accounts, selectedAccount, onSelectAccount,
  file, onFileSelect, onRemoveFile,
  syncMode, onSyncModeChange,
  onBack, onImport, importing,
  isOFX,
}) => (
  <div style={{ maxWidth: 560 }}>
    <Text style={{ color: brandColors.textSecondary, display: 'block', marginBottom: 16 }}>
      {isOFX
        ? 'Upload the file. All accounts will be matched automatically by account number.'
        : 'Select the account and upload the exported file.'}
    </Text>

    {isOFX ? (
      <Alert
        type="info"
        style={{ marginBottom: 20 }}
        description="This file can contain multiple accounts. Each account will be matched to your portfolio automatically by the last 4 digits of the account number."
      />
    ) : (
      <div style={{ marginBottom: 20 }}>
        <Text style={{ color: brandColors.textSecondary, fontSize: 13, display: 'block', marginBottom: 4 }}>
          Account
          <Text style={{ color: brandColors.textMuted, fontSize: 12, marginLeft: 6 }}>
            (optional — leave blank to auto-match by account number in file)
          </Text>
        </Text>
        <Select
          placeholder="Auto-match by account number"
          value={selectedAccount}
          onChange={onSelectAccount}
          size="large"
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="label"
          allowClear
        >
          {accounts.map(acc => (
            <Option key={acc.id} value={acc.id} label={acc.name}>
              <Space>
                <Text style={{ color: '#fff' }}>{acc.name}</Text>
                <Tag color="default" style={{ fontSize: 11 }}>
                  {institutionName(acc.institution)}
                </Tag>
              </Space>
            </Option>
          ))}
        </Select>
        {selectedAccount && (
          <Alert
            type="warning"
            style={{ marginTop: 8 }}
            description="All positions will be imported into the selected account."
          />
        )}
      </div>
    )}

    <div style={{ marginBottom: 20 }}>
      <Text style={{ color: brandColors.textSecondary, fontSize: 13, display: 'block', marginBottom: 8 }}>
        Export File
      </Text>
      <Dragger
        accept=".csv,.qfx,.ofx"
        maxCount={1}
        fileList={file ? [file] : []}
        beforeUpload={(f) => { onFileSelect(f); return false; }}
        onRemove={onRemoveFile}
        style={{ background: brandColors.darkHover, borderColor: brandColors.darkBorder }}
      >
        <p style={{ margin: '16px 0 8px' }}>
          <InboxOutlined style={{ fontSize: 36, color: brandColors.gold }} />
        </p>
        <p style={{ color: '#fff', fontSize: 14, margin: '0 0 4px' }}>Click or drag file here</p>
        <p style={{ color: brandColors.textMuted, fontSize: 12, margin: 0 }}>CSV, QFX, OFX</p>
      </Dragger>
    </div>

    <div style={{ marginBottom: 24 }}>
      <Tooltip title="Removes positions from the database that are no longer in the exported file.">
        <Checkbox
          checked={syncMode}
          onChange={e => onSyncModeChange(e.target.checked)}
          style={{ color: brandColors.textSecondary }}
        >
          Remove positions no longer in this file
          <Text style={{ color: brandColors.textMuted, fontSize: 12, marginLeft: 6 }}>
            (recommended for full position exports)
          </Text>
        </Checkbox>
      </Tooltip>
    </div>

    <Space>
      <Button size="large" onClick={onBack}>Back</Button>
      <Button
        type="primary"
        size="large"
        icon={<UploadOutlined />}
        disabled={!file}
        loading={importing}
        onClick={onImport}
        style={{ fontWeight: 600 }}
      >
        {importing ? 'Importing...' : 'Import File'}
      </Button>
    </Space>
  </div>
);

// =============================================================================
// Step 2b — Manual Entry (for cash/bank accounts with no recent transactions)
// =============================================================================
const StepManualEntry = ({ accounts, onBack, onSave, saving }) => {
  const [form] = Form.useForm();

  // Filter to cash-type accounts
  const cashAccounts = accounts.filter(a =>
    ['checking', 'savings', 'other'].includes(a.type)
  );

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values);
    } catch {
      // validation shown inline
    }
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <Text style={{ color: brandColors.textSecondary, display: 'block', marginBottom: 20 }}>
        Enter the current balance for a cash or bank account.
        Use this when there are no recent transactions to export.
      </Text>

      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="accountId"
          label="Account"
          rules={[{ required: true, message: 'Select an account' }]}
        >
          <Select
            placeholder="Select account"
            size="large"
            showSearch
            optionFilterProp="label"
          >
            {cashAccounts.map(acc => (
              <Option key={acc.id} value={acc.id} label={acc.name}>
                <Space>
                  <Text style={{ color: '#fff' }}>{acc.name}</Text>
                  <Tag color="default" style={{ fontSize: 11 }}>
                    {institutionName(acc.institution)}
                  </Tag>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="balance"
          label="Current Balance"
          rules={[
            { required: true, message: 'Balance is required' },
            { type: 'number', min: 0, message: 'Balance must be positive' },
          ]}
        >
          <InputNumber
            prefix="$"
            precision={2}
            size="large"
            style={{ width: '100%' }}
            placeholder="0.00"
            formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={val => val.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item name="assetName" label="Description (optional)">
          <Input placeholder="e.g. Checking Account Balance" />
        </Form.Item>
      </Form>

      <Space style={{ marginTop: 8 }}>
        <Button size="large" onClick={onBack}>Back</Button>
        <Button
          type="primary"
          size="large"
          icon={<EditOutlined />}
          loading={saving}
          onClick={handleSave}
          style={{ fontWeight: 600 }}
        >
          Save Balance
        </Button>
      </Space>
    </div>
  );
};

// =============================================================================
// Removed Positions component
// =============================================================================
const RemovedPositions = ({ positions, onAddToWatchlist, addingToWatchlist }) => {
  if (!positions || positions.length === 0) return null;

  return (
    <Card
      size="small"
      title={
        <Text style={{ color: '#faad14' }}>
          <WarningOutlined style={{ marginRight: 8 }} />
          Positions removed ({positions.length})
        </Text>
      }
      style={{ borderColor: '#faad14', marginBottom: 16 }}
      extra={
        <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
          These were in your account but not in the imported file
        </Text>
      }
    >
      {positions.map((pos, i) => (
        <div key={pos.ticker} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 0',
          borderBottom: i < positions.length - 1 ? `1px solid ${brandColors.darkBorder}` : 'none',
        }}>
          <Space size={12}>
            <Space orientation="vertical" size={0}>
              <Text style={{ color: '#fff', fontWeight: 600 }}>{pos.ticker}</Text>
              <Text style={{ color: brandColors.textMuted, fontSize: 11 }}>{pos.assetName}</Text>
            </Space>
            {pos.currentPrice && (
              <Space orientation="vertical" size={0}>
                <Text style={{ color: '#fff', fontSize: 13 }}>{formatCurrency(pos.currentPrice)}</Text>
                <Text style={{ fontSize: 11, color: gainLossColor(pos.changePercent) }}>
                  {formatPercent(pos.changePercent)}
                </Text>
              </Space>
            )}
          </Space>
          <Tooltip title="Add to watchlist">
            <Button
              size="small"
              icon={<StarOutlined />}
              loading={addingToWatchlist === pos.ticker}
              onClick={() => onAddToWatchlist(pos)}
              style={{ color: brandColors.gold, borderColor: brandColors.gold }}
            >
              Watch
            </Button>
          </Tooltip>
        </div>
      ))}
    </Card>
  );
};

// =============================================================================
// Step 3 — Results
// =============================================================================
const StepResults = ({ result, onImportAnother, onAddToWatchlist, addingToWatchlist }) => {
  if (!result) return null;

  const isSuccess = result.status === 'success';
  const isPartial = result.status === 'partial';
  const isFailed  = result.status === 'failed';

  return (
    <div style={{ maxWidth: 600 }}>
      <Card style={{ borderColor: brandColors.darkBorder, marginBottom: 20 }}>
        <Space size={16} wrap>
          <div style={{ textAlign: 'center', minWidth: 80 }}>
            {isSuccess && <CheckCircleOutlined style={{ fontSize: 32, color: brandColors.gain }} />}
            {isPartial && <WarningOutlined style={{ fontSize: 32, color: '#faad14' }} />}
            {isFailed  && <CloseCircleOutlined style={{ fontSize: 32, color: brandColors.loss }} />}
            <Text style={{
              display: 'block', marginTop: 4, fontWeight: 600, textTransform: 'capitalize',
              color: isSuccess ? brandColors.gain : isPartial ? '#faad14' : brandColors.loss,
            }}>
              {result.status}
            </Text>
          </div>

          <Divider orientation="vertical" style={{ height: 60, borderColor: brandColors.darkBorder }} />

          <Space size={24}>
            {result.filename && (
              <div>
                <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>File</Text>
                <Text style={{ color: '#fff', fontSize: 13 }}>{result.filename}</Text>
              </div>
            )}
            <div>
              <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>Imported</Text>
              <Text style={{ color: brandColors.gain, fontSize: 18, fontWeight: 700 }}>{result.rowsImported}</Text>
              <Text style={{ color: brandColors.textMuted, fontSize: 12 }}> positions</Text>
            </div>
            {result.rowsSkipped > 0 && (
              <div>
                <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>Skipped</Text>
                <Text style={{ color: brandColors.textSecondary, fontSize: 18, fontWeight: 700 }}>{result.rowsSkipped}</Text>
              </div>
            )}
            {result.removedPositions?.length > 0 && (
              <div>
                <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>Removed</Text>
                <Text style={{ color: '#faad14', fontSize: 18, fontWeight: 700 }}>{result.removedPositions.length}</Text>
              </div>
            )}
            {result.errors?.length > 0 && (
              <div>
                <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>Errors</Text>
                <Text style={{ color: brandColors.loss, fontSize: 18, fontWeight: 700 }}>{result.errors.length}</Text>
              </div>
            )}
            {result.asOfDate && (
              <div>
                <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>Data As Of</Text>
                <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>{formatDate(result.asOfDate)}</Text>
              </div>
            )}
            {result.balance && (
              <div>
                <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>Balance</Text>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{formatCurrency(result.balance)}</Text>
              </div>
            )}
          </Space>
        </Space>
      </Card>

      {/* OFX multi-account breakdown */}
      {result.multiAccount && result.accountResults?.length > 0 && (
        <Card
          size="small"
          title={<Text style={{ color: '#fff', fontWeight: 600 }}>Account Breakdown</Text>}
          style={{ borderColor: brandColors.darkBorder, marginBottom: 16 }}
        >
          {result.accountResults.map((ar, i) => (
            <div key={ar.accountId || i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0',
              borderBottom: i < result.accountResults.length - 1
                ? `1px solid ${brandColors.darkBorder}` : 'none',
            }}>
              <Text style={{ color: '#fff', fontSize: 13 }}>{ar.accountName}</Text>
              <Space size={16}>
                <Text style={{ color: brandColors.gain, fontSize: 13 }}>
                  {ar.rowsImported} imported
                </Text>
                {ar.rowsRemoved > 0 && (
                  <Text style={{ color: '#faad14', fontSize: 13 }}>
                    {ar.rowsRemoved} removed
                  </Text>
                )}
              </Space>
            </div>
          ))}
          {result.unmatchedAccountIds?.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${brandColors.darkBorder}` }}>
              <Text style={{ color: '#faad14', fontSize: 12 }}>
                ⚠ {result.unmatchedAccountIds.length} account(s) in the file had no match in your portfolio
                (IDs: {result.unmatchedAccountIds.join(', ')})
              </Text>
            </div>
          )}
        </Card>
      )}

      <RemovedPositions
        positions={result.removedPositions}
        onAddToWatchlist={onAddToWatchlist}
        addingToWatchlist={addingToWatchlist}
      />

      {result.errors?.length > 0 && (
        <Card
          size="small"
          title={<Text style={{ color: brandColors.loss }}><CloseCircleOutlined style={{ marginRight: 8 }} />Errors ({result.errors.length})</Text>}
          style={{ borderColor: brandColors.darkBorder, marginBottom: 16 }}
        >
          {result.errors.map((err, i) => (
            <div key={i} style={{
              padding: '8px 0',
              borderBottom: i < result.errors.length - 1 ? `1px solid ${brandColors.darkBorder}` : 'none'
            }}>
              <Space>
                {err.ticker && <Tag color="default" style={{ fontSize: 11 }}>{err.ticker}</Tag>}
                <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>{err.message}</Text>
              </Space>
            </div>
          ))}
        </Card>
      )}

      <Button
        type="primary"
        icon={<ReloadOutlined />}
        onClick={onImportAnother}
        style={{ fontWeight: 600 }}
      >
        Import Another
      </Button>
    </div>
  );
};

// =============================================================================
// Import Page
// =============================================================================
const Import = () => {
  const [currentStep, setCurrentStep]         = useState(0);
  const { user }                              = useAuth();
  const [importers, setImporters]             = useState([]);
  const [accounts, setAccounts]               = useState([]);
  const [selectedImporter, setSelectedImporter] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [file, setFile]                       = useState(null);
  const [syncMode, setSyncMode]               = useState(true);
  const [importing, setImporting]             = useState(false);
  const [result, setResult]                   = useState(null);
  const [history, setHistory]                 = useState([]);
  const [historyLoading, setHistoryLoading]   = useState(true);
  const [loadError, setLoadError]             = useState(null);
  const [addingToWatchlist, setAddingToWatchlist] = useState(null);
  const { message }                           = AntdApp.useApp();

  const selectedImporterObj = importers.find(i => i.id === selectedImporter);
  const isManual = selectedImporterObj?.isManual || false;

  useEffect(() => {
    if (!user) return;   // wait for auth before making API calls
    let cancelled = false;
    const loadData = async () => {
      try {
        const [importerData, accountData] = await Promise.all([
          importService.getImporters(),
          accountService.getAll(),
        ]);
        if (!cancelled) {
          setImporters(importerData);
          setAccounts(accountData.accounts.filter(a => a.is_active));
        }
        // Load history separately — failure here shouldn't block the page
        importService.getHistory()
          .then(d => { if (!cancelled) setHistory(d.history || []); })
          .catch(() => {});
      } catch {
        if (!cancelled) setLoadError('Failed to load import data');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [user]);

  const handleImport = async () => {
    if (!file || !selectedImporter) return;
    setImporting(true);
    try {
      const selectedImporterObj = importers.find(i => i.id === selectedImporter);
      const isMultiAccount = selectedImporterObj?.multiAccount === true;
      // Multi-account importers: no accountId needed — controller matches by last-4
      const data = await importService.upload(
        file,
        selectedImporter,
        isMultiAccount ? null : selectedAccount,
        syncMode
      );

      // Multi-account returns { matchedAccounts, results[], unmatchedAccountIds, parseWarnings }
      // Normalise to the shape StepResults expects
      if (isMultiAccount && data.results) {
        const totalImported = data.results.reduce((s, r) => s + (r.rowsImported || 0), 0);
        const totalRemoved  = data.results.reduce((s, r) => s + (r.rowsRemoved  || 0), 0);
        const allRemoved    = data.results.flatMap(r => r.removedPositions || []);
        setResult({
          status: 'success',
          rowsImported: totalImported,
          rowsRemoved: totalRemoved,
          removedPositions: allRemoved,
          matchedAccounts: data.matchedAccounts,
          unmatchedAccountIds: data.unmatchedAccountIds || [],
          errors: data.parseWarnings || [],
          multiAccount: true,
          accountResults: data.results,
        });
        message.success(
          `Imported ${totalImported} positions across ${data.matchedAccounts} account(s)`
        );
      } else {
        setResult(data);
        if (data.status === 'success') message.success(`Imported ${data.rowsImported} positions`);
        else if (data.status === 'partial') message.warning(`Partial import: ${data.rowsImported} imported`);
        else message.error('Import failed');
      }

      setCurrentStep(2);
      // Reload history separately — don't let it mask import success
      importService.getHistory()
        .then(d => setHistory(d.history || []))
        .catch(() => {}); // silently ignore history load failure
    } catch (err) {
      message.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleManualSave = async (values) => {
    setImporting(true);
    try {
      await importService.manualEntry(
        values.accountId,
        'CASH',
        values.balance,
        values.assetName || 'Cash Balance',
        'cash'
      );
      setResult({
        status: 'success',
        rowsImported: 1,
        balance: values.balance,
      });
      setCurrentStep(2);
      importService.getHistory()
        .then(d => setHistory(d.history || []))
        .catch(() => {});
      message.success(`Balance saved: ${formatCurrency(values.balance)}`);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save balance');
    } finally {
      setImporting(false);
    }
  };

  const handleAddToWatchlist = async (position) => {
    setAddingToWatchlist(position.ticker);
    try {
      await watchlistService.add(position.ticker, position.assetName, position.assetType, null, 'import_sync');
      message.success(`${position.ticker} added to watchlist`);
      setResult(prev => ({
        ...prev,
        removedPositions: prev.removedPositions.filter(p => p.ticker !== position.ticker),
      }));
    } catch (err) {
      if (err.response?.status === 409) message.info(`${position.ticker} is already on your watchlist`);
      else message.error('Failed to add to watchlist');
    } finally {
      setAddingToWatchlist(null);
    }
  };

  const handleImportAnother = () => {
    setCurrentStep(0);
    setSelectedImporter(null);
    setSelectedAccount(null);
    setFile(null);
    setResult(null);
    setSyncMode(true);
  };

  const steps = [
    { title: 'Institution' },
    { title: isManual ? 'Enter Balance' : 'Upload' },
    { title: 'Results' },
  ];

  if (loadError) return <Alert type="error" description={loadError} />;

  return (
    <div>
      <Title level={4} style={{ color: '#fff', marginBottom: 24, marginTop: 0 }}>
        Import Positions
      </Title>

      <Card style={{ borderColor: brandColors.darkBorder, marginBottom: 24 }}>
        <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} size="small" />

        {currentStep === 0 && (
          <StepSelectInstitution
            importers={importers}
            selectedImporter={selectedImporter}
            onSelect={setSelectedImporter}
            onNext={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 1 && isManual && (
          <StepManualEntry
            accounts={accounts}
            onBack={() => setCurrentStep(0)}
            onSave={handleManualSave}
            saving={importing}
          />
        )}

        {currentStep === 1 && !isManual && (
          <StepUploadFile
            accounts={accounts}
            selectedAccount={selectedAccount}
            onSelectAccount={setSelectedAccount}
            file={file}
            onFileSelect={setFile}
            onRemoveFile={() => setFile(null)}
            syncMode={syncMode}
            onSyncModeChange={setSyncMode}
            onBack={() => setCurrentStep(0)}
            onImport={handleImport}
            importing={importing}
            isOFX={importers.find(i => i.id === selectedImporter)?.multiAccount === true}
          />
        )}

        {currentStep === 2 && (
          <StepResults
            result={result}
            onImportAnother={handleImportAnother}
            onAddToWatchlist={handleAddToWatchlist}
            addingToWatchlist={addingToWatchlist}
          />
        )}
      </Card>

      <Title level={5} style={{ color: brandColors.textSecondary, marginBottom: 12 }}>
        Import History
      </Title>

      {historyLoading ? <Spin /> : (
        <Table
          dataSource={history}
          columns={historyColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, size: 'small' }}
          scroll={{ x: 700 }}
          style={{ borderRadius: 8, overflow: 'hidden' }}
          locale={{ emptyText: 'No imports yet' }}
        />
      )}
    </div>
  );
};

export default Import;
