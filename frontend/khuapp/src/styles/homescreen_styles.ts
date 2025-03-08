import { StyleSheet, Dimensions, TextStyle } from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { RFValue } from 'react-native-responsive-fontsize';

const { height: screenHeight } = Dimensions.get('window');

const commonTextStyle = (customStyle: Partial<TextStyle> = {}): TextStyle => ({
  fontFamily: 'PretendardVariable',
  fontWeight: customStyle.fontWeight ? customStyle.fontWeight : '400',
  ...customStyle,
});

export const homescreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: moderateScale(16),
  },
  
  header: {
    marginBottom: verticalScale(20),
    alignItems: 'center',
  },
  
  title: {
    ...commonTextStyle({
      fontWeight: '700',
    }),
    fontSize: RFValue(22),
    color: '#0D326F',
    marginBottom: verticalScale(8),
  },
  
  subtitle: {
    ...commonTextStyle(),
    fontSize: RFValue(14),
    color: '#64748b',
    marginBottom: verticalScale(16),
  },
  
  // 버튼 컨테이너 스타일
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: verticalScale(16),
    paddingHorizontal: moderateScale(4),
  },
  
  rightButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  headerButton: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
    backgroundColor: '#f1f5f9',
    marginLeft: moderateScale(8),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  headerButtonActive: {
    backgroundColor: '#0D326F',
    borderColor: '#0D326F',
  },
  
  headerButtonText: {
    ...commonTextStyle({
      fontWeight: '500',
    }),
    fontSize: RFValue(12),
    color: '#64748b',
  },
  
  headerButtonTextActive: {
    color: '#FFFFFF',
  },
  
  // 월별 상세보기 테이블 스타일
  monthlyTableContainer: {
    marginBottom: verticalScale(16),
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    backgroundColor: '#fff',
  },
  
  monthlyTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0D326F',
    borderTopLeftRadius: moderateScale(10),
    borderTopRightRadius: moderateScale(10),
    alignItems: 'center',
    minHeight: verticalScale(48),
    width: '100%',
    justifyContent: 'space-between',
  },
  
  monthlyTableHeaderText: {
    ...commonTextStyle({
      fontWeight: '600',
    }),
    fontSize: RFValue(13),
    color: '#FFFFFF',
    textAlign: 'center',
    flexShrink: 0,
    flexWrap: 'nowrap',
    minWidth: wp('10%'),
    letterSpacing: -0.5,
  },
  
  monthlyTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    minHeight: verticalScale(44),
    width: '100%',
    justifyContent: 'space-between',
  },
  
  monthlyTableCell: {
    ...commonTextStyle(),
    fontSize: RFValue(13),
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: -0.5,
    flexShrink: 0,
    minWidth: wp('10%'),
    flexWrap: 'nowrap',
  },
  
  monthlyTableCellHighlight: {
    ...commonTextStyle({
      fontWeight: '600',
    }),
    fontSize: RFValue(13),
    color: '#0D326F',
    textAlign: 'center',
    flexShrink: 0,
    minWidth: wp('10%'),
    paddingHorizontal: moderateScale(2),
    flexWrap: 'nowrap',
    letterSpacing: -0.5,
  },
  
  weekColumn: {
    flex: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: wp('9%'),
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  
  productColumn: {
    flex: 2.8,
    paddingLeft: moderateScale(10),
    justifyContent: 'center',
    minWidth: wp('32%'),
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  
  quantityColumn: {
    flex: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: wp('10%'),
    borderRightWidth: 0,
    borderRightColor: '#e2e8f0',
  },
  
  // 요약 섹션 스타일
  summarySection: {
    marginTop: moderateScale(8),
    backgroundColor: '#f8fafc',
    borderRadius: moderateScale(10),
    padding: moderateScale(18),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: moderateScale(16),
  },
  
  summaryTitle: {
    ...commonTextStyle({
      fontWeight: '600',
    }),
    fontSize: RFValue(17),
    color: '#0D326F',
    marginBottom: moderateScale(14),
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: moderateScale(10),
  },
  
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(9),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  
  summaryLabel: {
    ...commonTextStyle({
      fontWeight: '500',
    }),
    fontSize: RFValue(14),
    color: '#64748b',
  },
  
  summaryValue: {
    ...commonTextStyle({
      fontWeight: '600',
    }),
    fontSize: RFValue(14),
    color: '#0D326F',
  },
  
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(14),
    marginTop: moderateScale(6),
    backgroundColor: '#EFF6FF',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
  },
  
  summaryTotalLabel: {
    ...commonTextStyle({
      fontWeight: '700',
    }),
    fontSize: RFValue(15),
    color: '#0D326F',
  },
  
  summaryTotalValue: {
    ...commonTextStyle({
      fontWeight: '700',
    }),
    fontSize: RFValue(15),
    color: '#0D326F',
  },
  
  // 모달 스타일
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: moderateScale(16),
  },
  
  modalView: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: moderateScale(12),
  },
  
  modalTitle: {
    ...commonTextStyle({
      fontWeight: '700',
    }),
    fontSize: RFValue(18),
    color: '#0D326F',
  },
  
  closeButton: {
    padding: moderateScale(8),
  },
  
  closeButtonText: {
    ...commonTextStyle({
      fontWeight: '700',
    }),
    fontSize: RFValue(16),
    color: '#64748b',
  },

  // 새로운 대시보드 스타일
  dashboardContainer: {
    marginBottom: verticalScale(16),
  },

  dashboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },

  dashboardCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    padding: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginHorizontal: moderateScale(4),
  },

  dashboardCardWide: {
    flex: 2,
  },

  dashboardCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: moderateScale(8),
  },

  dashboardCardTitle: {
    ...commonTextStyle({
      fontWeight: '600',
    }),
    fontSize: RFValue(14),
    color: '#0D326F',
  },

  dashboardCardValue: {
    ...commonTextStyle({
      fontWeight: '700',
    }),
    fontSize: RFValue(20),
    color: '#0D326F',
    textAlign: 'center',
    marginVertical: verticalScale(8),
  },

  dashboardCardSubtitle: {
    ...commonTextStyle(),
    fontSize: RFValue(12),
    color: '#64748b',
    textAlign: 'center',
  },

  dashboardCardContent: {
    flex: 1,
    justifyContent: 'center',
  },

  dashboardCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(8),
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },

  dashboardCardFooterText: {
    ...commonTextStyle(),
    fontSize: RFValue(12),
    color: '#64748b',
  },

  dashboardCardFooterValue: {
    ...commonTextStyle({
      fontWeight: '600',
    }),
    fontSize: RFValue(12),
    color: '#0D326F',
  },

  dashboardCardFooterValuePositive: {
    color: '#10b981',
  },

  dashboardCardFooterValueNegative: {
    color: '#ef4444',
  },

  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(4),
  },

  trendText: {
    ...commonTextStyle(),
    fontSize: RFValue(12),
    marginLeft: moderateScale(4),
  },

  trendPositive: {
    color: '#10b981',
  },

  trendNegative: {
    color: '#ef4444',
  },

  trendNeutral: {
    color: '#64748b',
  },

  miniChart: {
    height: verticalScale(40),
    marginVertical: verticalScale(8),
  },

  topProductsContainer: {
    marginTop: verticalScale(8),
  },

  topProductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(6),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  topProductName: {
    ...commonTextStyle(),
    fontSize: RFValue(12),
    color: '#1e293b',
    flex: 2,
  },

  topProductValue: {
    ...commonTextStyle({
      fontWeight: '500',
    }),
    fontSize: RFValue(12),
    color: '#0D326F',
    textAlign: 'right',
    flex: 1,
  },

  periodSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },

  periodButton: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    backgroundColor: '#f1f5f9',
    marginHorizontal: moderateScale(4),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  periodButtonActive: {
    backgroundColor: '#0D326F',
    borderColor: '#0D326F',
  },

  periodButtonText: {
    ...commonTextStyle({
      fontWeight: '500',
    }),
    fontSize: RFValue(12),
    color: '#64748b',
  },

  periodButtonTextActive: {
    color: '#FFFFFF',
  },

  inventoryAlertContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  inventoryAlertTitle: {
    ...commonTextStyle({
      fontWeight: '600',
    }),
    fontSize: RFValue(14),
    color: '#b91c1c',
    marginBottom: verticalScale(8),
  },

  inventoryAlertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(4),
  },

  inventoryAlertName: {
    ...commonTextStyle(),
    fontSize: RFValue(12),
    color: '#7f1d1d',
    flex: 3,
  },

  inventoryAlertValue: {
    ...commonTextStyle({
      fontWeight: '500',
    }),
    fontSize: RFValue(12),
    color: '#7f1d1d',
    flex: 1,
    textAlign: 'right',
  },

  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },

  actionButton: {
    flex: 1,
    backgroundColor: '#0D326F',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    alignItems: 'center',
    marginHorizontal: moderateScale(4),
  },

  actionButtonText: {
    ...commonTextStyle({
      fontWeight: '600',
    }),
    fontSize: RFValue(14),
    color: '#FFFFFF',
  },

  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: verticalScale(8),
  },

  comparisonLabel: {
    ...commonTextStyle(),
    fontSize: RFValue(12),
    color: '#64748b',
    flex: 2,
  },

  comparisonValue: {
    ...commonTextStyle({
      fontWeight: '500',
    }),
    fontSize: RFValue(12),
    color: '#0D326F',
    flex: 1,
    textAlign: 'right',
  },

  comparisonBar: {
    height: verticalScale(8),
    backgroundColor: '#e2e8f0',
    borderRadius: moderateScale(4),
    marginTop: verticalScale(4),
    overflow: 'hidden',
  },

  comparisonBarFill: {
    height: '100%',
    backgroundColor: '#0D326F',
  },
});

// DateRangeModal 스타일
export const dateRangeStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: moderateScale(12),
    width: '90%',
    maxWidth: wp('90%'),
    padding: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    marginBottom: moderateScale(10),
  },
  
  modalTitle: {
    ...commonTextStyle({
      fontWeight: '600',
    }),
    fontSize: RFValue(18),
    color: '#0D326F',
  },
  
  closeButton: {
    padding: moderateScale(5),
  },
  
  closeButtonText: {
    ...commonTextStyle(),
    fontSize: RFValue(20),
    color: '#666',
  },
  
  presetButtons: {
    flexDirection: 'row',
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(8),
  },
  
  presetButton: {
    backgroundColor: '#f0f4f9',
    borderWidth: 1,
    borderColor: '#d0dae9',
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    marginRight: moderateScale(8),
  },
  
  activePresetButton: {
    backgroundColor: '#e0eaf9',
    borderColor: '#0D326F',
  },
  
  presetButtonText: {
    ...commonTextStyle(),
    fontSize: RFValue(14),
    color: '#000',
  },
  
  activePresetButtonText: {
    ...commonTextStyle(),
    color: '#0D326F',
  },
  
  searchButton: {
    width: '100%',
    padding: moderateScale(14),
    backgroundColor: '#0D326F',
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginTop: moderateScale(10),
  },
  
  searchButtonText: {
    ...commonTextStyle({
      fontWeight: '600',
    }),
    color: 'white',
    fontSize: RFValue(16),
  },
});