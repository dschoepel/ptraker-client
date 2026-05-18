import { useState, useEffect } from 'react';
import {
  Steps, Card, Select, Button, Upload, Typography, Alert,
  Table, Tag, Space, Divider, App as AntdApp, Spin, Checkbox, Tooltip
} from 'antd';
import {
  UploadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, InboxOutlined, ReloadOutlined, StarOutlined
} from '@ant-design/icons';
import { importService, accountService, watchlistService } from '../services/dashboard.service';
import { formatCurrency, formatPercent, formatDate, institutionName, gainLossColor } from '../utils/formatters';
import { brandColors } from '../theme';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

// =============================================================================
// Import Page — 3-step wizard
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
      Select the institution you are importing from.
    </Text>

    <Select
      placeholder="Select institution / file format"
      value={selectedImporter}
      onChange={onSelect}
      size="large"
      style={{ width: '100%', marginBottom: 24 }}
    >
      {importers.map(imp => (
        <Option key={imp.id} value={imp.id}>
          <Space>
            <Text style={{ color: '#fff' }}>{imp.name}</Text>
            <Text style={{ color: brandColors.textMuted, fontSize: 12 }}>
              ({imp.accepts.join(', ').toUpperCase()})
            </Text>
          </Space>
        </Option>
      ))}
    </Select>

    {selectedImporter && (
      <Alert
        type="info"
        style={{ marginBottom: 24 }}
        message={
          <Text style={{ fontSize: 13 }}>
            {importers.find(i => i.id === selectedImporter)?.description}
          </Text>
        }
      />
    )}

    <Button
      type="primary"
      size="large"
      disabled={!selectedImporter}
      onClick={onNext}
      style={{ fontWeight: 600 }}
    >
      Next: Select Account
    </Button>
  </div>
);

// =============================================================================
// Step 2 — Select Account + Upload File
// =============================================================================
const StepUploadFile = ({
  accounts, selectedAccount, onSelectAccount,
  file, onFileSelect, onRemoveFile,
  syncMode, onSyncModeChange,
  onBack, onImport, importing
}) => (
  <div style={{ maxWidth: 560 }}>
    <Text style={{ color: brandColors.textSecondary, display: 'block', marginBottom: 16 }}>
      Select the account and upload the exported file.
    </Text>

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
          message={
            <Text style={{ fontSize: 12 }}>
              All positions in this file will be imported into the selected account,
              overriding auto-matching.
            </Text>
          }
        />
      )}
    </div>

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
        <p style={{ color: brandColors.textMuted, fontSize: 12, margin: 0 }}>
          Accepted: CSV, QFX, OFX
        </p>
      </Dragger>
    </div>

    <div style={{ marginBottom: 24 }}>
      <Tooltip title="Removes positions from the database that are no longer in the exported file. Useful when you've sold a position. You'll have the option to add removed positions to your watchlist.">
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
// Removed Positions — shown in results when sync-delete ran
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
          borderBottom: i < positions.length - 1
            ? `1px solid ${brandColors.darkBorder}`
            : 'none',
        }}>
          <Space size={12}>
            <Space direction="vertical" size={0}>
              <Text style={{ color: '#fff', fontWeight: 600 }}>{pos.ticker}</Text>
              <Text style={{ color: brandColors.textMuted, fontSize: 11 }}>{pos.assetName}</Text>
            </Space>
            {pos.currentPrice && (
              <Space direction="vertical" size={0}>
                <Text style={{ color: '#fff', fontSize: 13 }}>
                  {formatCurrency(pos.currentPrice)}
                </Text>
                <Text style={{ fontSize: 11, color: gainLossColor(pos.changePercent) }}>
                  {formatPercent(pos.changePercent)}
                </Text>
              </Space>
            )}
          </Space>

          <Tooltip title="Add to watchlist to track this security">
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

          <Divider type="vertical" style={{ height: 60, borderColor: brandColors.darkBorder }} />

          <Space size={24}>
            <div>
              <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>File</Text>
              <Text style={{ color: '#fff', fontSize: 13 }}>{result.filename}</Text>
            </div>
            <div>
              <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>Imported</Text>
              <Text style={{ color: brandColors.gain, fontSize: 18, fontWeight: 700 }}>{result.rowsImported}</Text>
              <Text style={{ color: brandColors.textMuted, fontSize: 12 }}> positions</Text>
            </div>
            <div>
              <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>Skipped</Text>
              <Text style={{ color: brandColors.textSecondary, fontSize: 18, fontWeight: 700 }}>{result.rowsSkipped}</Text>
            </div>
            {result.removedPositions?.length > 0 && (
              <div>
                <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>Removed</Text>
                <Text style={{ color: '#faad14', fontSize: 18, fontWeight: 700 }}>
                  {result.removedPositions.length}
                </Text>
              </div>
            )}
            {result.errors?.length > 0 && (
              <div>
                <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>Errors</Text>
                <Text style={{ color: brandColors.loss, fontSize: 18, fontWeight: 700 }}>
                  {result.errors.length}
                </Text>
              </div>
            )}
            {result.asOfDate && (
              <div>
                <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>Data As Of</Text>
                <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>{formatDate(result.asOfDate)}</Text>
              </div>
            )}
          </Space>
        </Space>
      </Card>

      {/* Removed positions with watchlist option */}
      <RemovedPositions
        positions={result.removedPositions}
        onAddToWatchlist={onAddToWatchlist}
        addingToWatchlist={addingToWatchlist}
      />

      {/* Errors */}
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
        Import Another File
      </Button>
    </div>
  );
};

// =============================================================================
// Import Page
// =============================================================================
const Import = () => {
  const [currentStep, setCurrentStep]         = useState(0);
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

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [importerData, accountData, historyData] = await Promise.all([
          importService.getImporters(),
          accountService.getAll(),
          importService.getHistory(),
        ]);
        if (!cancelled) {
          setImporters(importerData);
          setAccounts(accountData.accounts.filter(a => a.is_active));
          setHistory(historyData.history || []);
        }
      } catch {
        if (!cancelled) setLoadError('Failed to load import data');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, []);

  const handleImport = async () => {
    if (!file || !selectedImporter) return;

    setImporting(true);
    try {
      const data = await importService.upload(file, selectedImporter, selectedAccount, syncMode);
      setResult(data);
      setCurrentStep(2);

      const historyData = await importService.getHistory();
      setHistory(historyData.history || []);

      if (data.status === 'success') {
        message.success(`Imported ${data.rowsImported} positions`);
      } else if (data.status === 'partial') {
        message.warning(`Partial import: ${data.rowsImported} imported, ${data.errors?.length} errors`);
      } else {
        message.error('Import failed — see errors below');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleAddToWatchlist = async (position) => {
    setAddingToWatchlist(position.ticker);
    try {
      await watchlistService.add(
        position.ticker,
        position.assetName,
        position.assetType,
        null,
        'import_sync'
      );
      message.success(`${position.ticker} added to watchlist`);
      // Remove from removed positions display
      setResult(prev => ({
        ...prev,
        removedPositions: prev.removedPositions.filter(p => p.ticker !== position.ticker),
      }));
    } catch (err) {
      if (err.response?.status === 409) {
        message.info(`${position.ticker} is already on your watchlist`);
      } else {
        message.error('Failed to add to watchlist');
      }
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
    { title: 'Upload'      },
    { title: 'Results'     },
  ];

  if (loadError) return <Alert type="error" message={loadError} />;

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

        {currentStep === 1 && (
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
