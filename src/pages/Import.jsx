import { useState, useEffect } from 'react';
import {
  Steps, Card, Select, Button, Upload, Typography, Alert,
  Table, Tag, Space, Divider, App as AntdApp, Spin
} from 'antd';
import {
  UploadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, InboxOutlined, ReloadOutlined
} from '@ant-design/icons';
import { importService, accountService } from '../services/dashboard.service';
import { formatDate, institutionName } from '../utils/formatters';
import { brandColors } from '../theme';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

// =============================================================================
// Import Page — 3-step wizard
// =============================================================================
// Step 1: Select institution (importer plugin)
// Step 2: Select account + upload file
// Step 3: Results
// =============================================================================

// Import history table columns
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
      Select the institution you are importing from. Each institution has its own
      file format — make sure to export the file in the correct format.
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
  onBack, onImport, importing
}) => {

  return (
    <div style={{ maxWidth: 560 }}>
      <Text style={{ color: brandColors.textSecondary, display: 'block', marginBottom: 16 }}>
        Select the account this file belongs to, then upload the exported file.
      </Text>

      {/* Account selector */}
      <div style={{ marginBottom: 20 }}>
        <Text style={{
          color: brandColors.textSecondary,
          fontSize: 13,
          display: 'block',
          marginBottom: 8
        }}>
          Account
        </Text>
        <Select
          placeholder="Select account"
          value={selectedAccount}
          onChange={onSelectAccount}
          size="large"
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="label"
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
      </div>

      {/* File upload */}
      <div style={{ marginBottom: 24 }}>
        <Text style={{
          color: brandColors.textSecondary,
          fontSize: 13,
          display: 'block',
          marginBottom: 8
        }}>
          Export File
        </Text>
        <Dragger
          accept=".csv,.qfx,.ofx"
          maxCount={1}
          fileList={file ? [file] : []}
          beforeUpload={(f) => { onFileSelect(f); return false; }} // prevent auto-upload
          onRemove={onRemoveFile}
          style={{ background: brandColors.darkHover, borderColor: brandColors.darkBorder }}
        >
          <p style={{ margin: '16px 0 8px' }}>
            <InboxOutlined style={{ fontSize: 36, color: brandColors.gold }} />
          </p>
          <p style={{ color: '#fff', fontSize: 14, margin: '0 0 4px' }}>
            Click or drag file here
          </p>
          <p style={{ color: brandColors.textMuted, fontSize: 12, margin: 0 }}>
            Accepted formats: CSV, QFX, OFX
          </p>
        </Dragger>
      </div>

      <Space>
        <Button size="large" onClick={onBack}>
          Back
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<UploadOutlined />}
          disabled={!selectedAccount || !file}
          loading={importing}
          onClick={onImport}
          style={{ fontWeight: 600 }}
        >
          {importing ? 'Importing...' : 'Import File'}
        </Button>
      </Space>
    </div>
  );
};

// =============================================================================
// Step 3 — Results
// =============================================================================
const StepResults = ({ result, onImportAnother }) => {
  if (!result) return null;

  const isSuccess = result.status === 'success';
  const isPartial = result.status === 'partial';
  const isFailed  = result.status === 'failed';

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Summary */}
      <Card style={{ borderColor: brandColors.darkBorder, marginBottom: 20 }}>
        <Space size={16} wrap>
          <div style={{ textAlign: 'center', minWidth: 80 }}>
            {isSuccess && <CheckCircleOutlined style={{ fontSize: 32, color: brandColors.gain }} />}
            {isPartial && <WarningOutlined style={{ fontSize: 32, color: '#faad14' }} />}
            {isFailed  && <CloseCircleOutlined style={{ fontSize: 32, color: brandColors.loss }} />}
            <Text style={{
              display: 'block',
              marginTop: 4,
              color: isSuccess ? brandColors.gain : isPartial ? '#faad14' : brandColors.loss,
              fontWeight: 600,
              textTransform: 'capitalize',
            }}>
              {result.status}
            </Text>
          </div>

          <Divider type="vertical" style={{ height: 60, borderColor: brandColors.darkBorder }} />

          <Space size={24}>
            <div>
              <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>
                File
              </Text>
              <Text style={{ color: '#fff', fontSize: 13 }}>{result.filename}</Text>
            </div>
            <div>
              <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>
                Imported
              </Text>
              <Text style={{ color: brandColors.gain, fontSize: 18, fontWeight: 700 }}>
                {result.rowsImported}
              </Text>
              <Text style={{ color: brandColors.textMuted, fontSize: 12 }}> positions</Text>
            </div>
            <div>
              <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>
                Skipped
              </Text>
              <Text style={{ color: brandColors.textSecondary, fontSize: 18, fontWeight: 700 }}>
                {result.rowsSkipped}
              </Text>
            </div>
            {result.errors?.length > 0 && (
              <div>
                <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>
                  Errors
                </Text>
                <Text style={{ color: brandColors.loss, fontSize: 18, fontWeight: 700 }}>
                  {result.errors.length}
                </Text>
              </div>
            )}
            {result.asOfDate && (
              <div>
                <Text style={{ color: brandColors.textMuted, fontSize: 12, display: 'block' }}>
                  Data As Of
                </Text>
                <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>
                  {formatDate(result.asOfDate)}
                </Text>
              </div>
            )}
          </Space>
        </Space>
      </Card>

      {/* Errors detail */}
      {result.errors?.length > 0 && (
        <Card
          size="small"
          title={
            <Text style={{ color: brandColors.loss }}>
              <CloseCircleOutlined style={{ marginRight: 8 }} />
              Errors ({result.errors.length})
            </Text>
          }
          style={{ borderColor: brandColors.darkBorder, marginBottom: 16 }}
        >
          {result.errors.map((err, i) => (
            <div key={i} style={{
              padding: '8px 0',
              borderBottom: i < result.errors.length - 1
                ? `1px solid ${brandColors.darkBorder}`
                : 'none'
            }}>
              <Space>
                {err.ticker && (
                  <Tag color="default" style={{ fontSize: 11 }}>{err.ticker}</Tag>
                )}
                <Text style={{ color: brandColors.textSecondary, fontSize: 13 }}>
                  {err.message}
                </Text>
                {err.type && (
                  <Text style={{ color: brandColors.textMuted, fontSize: 11 }}>
                    [{err.type}]
                  </Text>
                )}
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
  const [currentStep, setCurrentStep]       = useState(0);
  const [importers, setImporters]           = useState([]);
  const [accounts, setAccounts]             = useState([]);
  const [selectedImporter, setSelectedImporter] = useState(null);
  const [selectedAccount, setSelectedAccount]   = useState(null);
  const [file, setFile]                     = useState(null);
  const [importing, setImporting]           = useState(false);
  const [result, setResult]                 = useState(null);
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadError, setLoadError]           = useState(null);
  const { message }                         = AntdApp.useApp();

  // Load importers, accounts, and history on mount
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
      } catch  {
        if (!cancelled) setLoadError('Failed to load import data');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, []);

  const handleImport = async () => {
    if (!file || !selectedImporter || !selectedAccount) return;

    setImporting(true);
    try {
      const data = await importService.upload(file, selectedImporter, selectedAccount);
      setResult(data);
      setCurrentStep(2);

      // Refresh history
      const historyData = await importService.getHistory();
      setHistory(historyData.history || []);

      if (data.status === 'success') {
        message.success(`Imported ${data.rowsImported} positions successfully`);
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

  const handleImportAnother = () => {
    setCurrentStep(0);
    setSelectedImporter(null);
    setSelectedAccount(null);
    setFile(null);
    setResult(null);
  };

  const steps = [
    { title: 'Institution' },
    { title: 'Upload'      },
    { title: 'Results'     },
  ];

  if (loadError) {
    return <Alert type="error" message={loadError} />;
  }

  return (
    <div>
      <Title level={4} style={{ color: '#fff', marginBottom: 24, marginTop: 0 }}>
        Import Positions
      </Title>

      {/* Wizard steps */}
      <Card style={{ borderColor: brandColors.darkBorder, marginBottom: 24 }}>
        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: 32 }}
          size="small"
        />

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
            onBack={() => setCurrentStep(0)}
            onImport={handleImport}
            importing={importing}
          />
        )}

        {currentStep === 2 && (
          <StepResults
            result={result}
            onImportAnother={handleImportAnother}
          />
        )}
      </Card>

      {/* Import history */}
      <Title level={5} style={{ color: brandColors.textSecondary, marginBottom: 12 }}>
        Import History
      </Title>

      {historyLoading ? (
        <Spin />
      ) : (
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
