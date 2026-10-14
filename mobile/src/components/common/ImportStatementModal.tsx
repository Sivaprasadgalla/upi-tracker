import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../../theme/ThemeContext';
import { useApp } from '../../store/AppContext';
import { api } from '../../api/client';
import { Icon } from './Icon';

interface ImportStatementModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ImportStats {
  totalParsed: number;
  inserted: number;
  duplicatesSkipped: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
}

export const ImportStatementModal: React.FC<ImportStatementModalProps> = ({ visible, onClose }) => {
  const { theme, isDark } = useTheme();
  const { refreshData } = useApp();

  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [pastedText, setPastedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const resetState = () => {
    setSelectedFileName(null);
    setFileContent('');
    setPastedText('');
    setIsLoading(false);
    setImportStats(null);
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handlePickDocument = async () => {
    try {
      Haptics.selectionAsync();
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
        copyToCacheDirectory: true
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setSelectedFileName(file.name);
        setErrorMsg(null);

        // Read text content
        const content = await FileSystem.readAsStringAsync(file.uri);
        setFileContent(content);
      }
    } catch (err: any) {
      console.warn('Error picking document:', err);
      setErrorMsg('Could not open file. Try using the "Paste Statement" tab.');
    }
  };

  const handleImport = async () => {
    const contentToImport = activeTab === 'file' ? fileContent : pastedText;

    if (!contentToImport || contentToImport.trim().length === 0) {
      Alert.alert('Empty Content', activeTab === 'file' ? 'Please select a CSV or statement file first.' : 'Please paste your statement or SMS text.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const res = await api.post('/transactions/import/statement', {
        content: contentToImport
      });

      if (res.data?.success && res.data?.stats) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setImportStats(res.data.stats);
        await refreshData();
      } else {
        setErrorMsg(res.data?.message || 'Failed to parse statement.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Import failed. Check format.';
      setErrorMsg(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconBadge, { backgroundColor: theme.primaryLight }]}>
                <Icon name="download" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Import Statement</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  PhonePe, Paytm, GPay &amp; Bank Statements
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: theme.fill }]}>
              <Icon name="close" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Success Result View */}
          {importStats ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12 }}>
              <View style={[styles.successBox, { backgroundColor: isDark ? '#06301A' : '#E8F8EE' }]}>
                <View style={styles.successIconCircle}>
                  <Icon name="check" size={26} color="#34C759" />
                </View>
                <Text style={[styles.successTitle, { color: theme.textPrimary }]}>
                  Import Completed!
                </Text>
                <Text style={[styles.successSubtitle, { color: theme.textSecondary }]}>
                  Your past transactions are now synchronized with your budgets &amp; analytics.
                </Text>

                <View style={styles.statsGrid}>
                  <View style={[styles.statItem, { backgroundColor: theme.cardBg }]}>
                    <Text style={[styles.statValue, { color: theme.primary }]}>{importStats.inserted}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>New Records</Text>
                  </View>
                  <View style={[styles.statItem, { backgroundColor: theme.cardBg }]}>
                    <Text style={[styles.statValue, { color: theme.textSecondary }]}>{importStats.duplicatesSkipped}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Duplicates Skipped</Text>
                  </View>
                </View>

                <View style={[styles.cashflowRow, { backgroundColor: theme.cardBg }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cashflowLabel, { color: theme.textSecondary }]}>DEBITS (SPENT)</Text>
                    <Text style={[styles.cashflowDebit, { color: theme.textPrimary }]}>
                      -₹{importStats.totalDebitAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cashflowLabel, { color: theme.textSecondary }]}>CREDITS (INCOME)</Text>
                    <Text style={[styles.cashflowCredit, { color: theme.success }]}>
                      +₹{importStats.totalCreditAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionBtnText}>Done / View Dashboard</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
              {/* Tab Switcher */}
              <View style={[styles.tabContainer, { backgroundColor: theme.fill }]}>
                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'file' && [styles.tabItemActive, { backgroundColor: theme.cardBg }]]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveTab('file');
                    setErrorMsg(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="document" size={16} color={activeTab === 'file' ? theme.primary : theme.textSecondary} />
                  <Text style={[styles.tabText, { color: activeTab === 'file' ? theme.textPrimary : theme.textSecondary }]}>
                    Upload File (.CSV)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'paste' && [styles.tabItemActive, { backgroundColor: theme.cardBg }]]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveTab('paste');
                    setErrorMsg(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="edit" size={16} color={activeTab === 'paste' ? theme.primary : theme.textSecondary} />
                  <Text style={[styles.tabText, { color: activeTab === 'paste' ? theme.textPrimary : theme.textSecondary }]}>
                    Paste Text / SMS
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {errorMsg && (
                <View style={[styles.errorBanner, { backgroundColor: isDark ? '#3D0F0F' : '#FDE8E8' }]}>
                  <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
                </View>
              )}

              {/* TAB 1: File Upload */}
              {activeTab === 'file' && (
                <View style={styles.tabContent}>
                  <TouchableOpacity
                    style={[styles.fileDropZone, { borderColor: selectedFileName ? theme.primary : theme.cardBorder, backgroundColor: theme.fill }]}
                    onPress={handlePickDocument}
                    activeOpacity={0.7}
                  >
                    <Icon name={selectedFileName ? 'check' : 'download'} size={32} color={selectedFileName ? theme.success : theme.primary} />
                    <Text style={[styles.fileDropTitle, { color: theme.textPrimary }]}>
                      {selectedFileName ? selectedFileName : 'Tap to Choose Statement File'}
                    </Text>
                    <Text style={[styles.fileDropSubtitle, { color: theme.textSecondary }]}>
                      {selectedFileName ? 'File loaded ready to import' : 'Supports PhonePe, Paytm & Bank CSV / Excel files'}
                    </Text>
                  </TouchableOpacity>

                  {selectedFileName && (
                    <TouchableOpacity
                      onPress={handlePickDocument}
                      style={{ alignSelf: 'center', marginTop: 8 }}
                    >
                      <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '600' }}>Change File</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* TAB 2: Paste Statement Text */}
              {activeTab === 'paste' && (
                <View style={styles.tabContent}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    PASTE STATEMENT CSV ROWS OR BANK SMS MESSAGES:
                  </Text>
                  <TextInput
                    style={[
                      styles.pasteTextInput,
                      {
                        backgroundColor: theme.fill,
                        borderColor: theme.cardBorder,
                        color: theme.textPrimary
                      }
                    ]}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    placeholder="Paste PhonePe statement rows, CSV content, or copy-paste multiple Bank SMS messages here..."
                    placeholderTextColor={theme.textTertiary}
                    value={pastedText}
                    onChangeText={setPastedText}
                  />
                  {pastedText.length > 0 && (
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4, textAlign: 'right' }}>
                      {pastedText.split('\n').filter((l) => l.trim().length > 0).length} lines ready
                    </Text>
                  )}
                </View>
              )}

              {/* How to download statement guide */}
              <TouchableOpacity
                style={styles.guideToggle}
                onPress={() => setShowGuide((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Text style={[styles.guideToggleText, { color: theme.primary }]}>
                  {showGuide ? 'Hide Instructions ▲' : '💡 How to download statements from PhonePe/Banks ▼'}
                </Text>
              </TouchableOpacity>

              {showGuide && (
                <View style={[styles.guideBox, { backgroundColor: theme.fill }]}>
                  <Text style={[styles.guideStep, { color: theme.textPrimary }]}>
                    • <Text style={{ fontWeight: '700' }}>PhonePe:</Text> Open PhonePe $\rightarrow$ History $\rightarrow$ Tap the Download Statement icon at the top $\rightarrow$ Choose duration $\rightarrow$ Download CSV.
                  </Text>
                  <Text style={[styles.guideStep, { color: theme.textPrimary }]}>
                    • <Text style={{ fontWeight: '700' }}>Paytm:</Text> Balance &amp; History $\rightarrow$ Request Statement $\rightarrow$ Select Dates $\rightarrow$ Download CSV.
                  </Text>
                  <Text style={[styles.guideStep, { color: theme.textPrimary }]}>
                    • <Text style={{ fontWeight: '700' }}>Bank (ICICI/HDFC/SBI):</Text> Netbanking or Mobile Banking App $\rightarrow$ Statements $\rightarrow$ Export CSV/Excel.
                  </Text>
                </View>
              )}

              {/* Import Action Button */}
              <TouchableOpacity
                style={[
                  styles.primaryActionBtn,
                  { backgroundColor: theme.primary },
                  isLoading && { opacity: 0.7 }
                ]}
                onPress={handleImport}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="download" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryActionBtnText}>Import Transactions</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
    borderWidth: 0.5
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700'
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  tabItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600'
  },
  tabContent: {
    marginBottom: 14
  },
  fileDropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fileDropTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10
  },
  fileDropSubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center'
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  pasteTextInput: {
    height: 120,
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 12,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  guideToggle: {
    paddingVertical: 8,
    alignItems: 'center'
  },
  guideToggleText: {
    fontSize: 12,
    fontWeight: '600'
  },
  guideBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 14
  },
  guideStep: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6
  },
  primaryActionBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  errorBanner: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500'
  },
  successBox: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14
  },
  successIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  successTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 4
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12
  },
  statItem: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800'
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2
  },
  cashflowRow: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 10,
    width: '100%'
  },
  cashflowLabel: {
    fontSize: 10,
    fontWeight: '700'
  },
  cashflowDebit: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2
  },
  cashflowCredit: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2
  }
});
