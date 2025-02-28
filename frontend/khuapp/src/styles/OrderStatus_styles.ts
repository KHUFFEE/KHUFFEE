import { StyleSheet, Dimensions } from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { RFValue } from 'react-native-responsive-fontsize';

const { height: screenHeight } = Dimensions.get('window');

const commonTextStyle = {
  fontFamily: 'Pretendard-Regular',
};

export const orderStatusStyles = StyleSheet.create({
  status_container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: moderateScale(16),
  },
  
  // 헤더 스타일
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
    backgroundColor: '#fff',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.05,
    // shadowRadius: 3,
    // elevation: 2,
  },
  
  sectionTitle: {
    flex: 1,
  },
  
  title: {
    ...commonTextStyle,
    fontSize: RFValue(20),
    fontWeight: '600',
    color: '#0D326F',
  },
  
  rightButtonGroup: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  
  headerButton: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(10),
    backgroundColor: '#0D326F',
    borderRadius: moderateScale(25),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  
  headerButtonText: {
    ...commonTextStyle,
    color: '#FFFFFF',
    fontSize: RFValue(14),
    fontWeight: '600',
  },

  // 로딩 & 빈 상태
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    color: '#666666',
    fontWeight: '500',
  },

  // 리스트 스타일
  flatlist: {
    flex: 1,
  },

  yearHeader: {
    ...commonTextStyle,
    fontSize: RFValue(20),
    fontWeight: '700',
    color: '#0D326F',
    marginBottom: verticalScale(8),
    marginTop: verticalScale(10),
    paddingLeft: moderateScale(10),
    borderLeftWidth: 4,
    borderLeftColor: '#0D326F',
  },

  monthContainer: {
    backgroundColor: '#f8f9fa',
    marginBottom: verticalScale(10),
  },

  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: moderateScale(10),
    gap: moderateScale(10),
  },

  monthTitle: {
    ...commonTextStyle,
    fontSize: RFValue(18),
    fontWeight: '600',
    color: '#1A1A1A',
  },

  monthTotal: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: '600',
    color: '#0D326F',
  },

  weekContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(8),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    paddingBottom: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  weekTitle: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: '600',
    color: '#1A1A1A',
  },

  weekTotal: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: '600',
    color: '#0D326F',
  },

  orderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  orderInfo: {
    flex: 1,
  },

  productName: {
    ...commonTextStyle,
    fontSize: RFValue(15),
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: verticalScale(4),
  },

  extraCount: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    color: '#666666',
    marginBottom: verticalScale(4),
  },

  quantity: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    color: '#1A1A1A',
    fontWeight: '500',
  },

  detailButton: {
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(25),
    marginLeft: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#0D326F',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  detailButtonText: {
    ...commonTextStyle,
    color: '#0D326F',
    fontSize: RFValue(14),
    fontWeight: '600',
  },

  loadMoreButton: {
    backgroundColor: '#FFFFFF',
    padding: moderateScale(12),
    borderRadius: moderateScale(25),
    alignItems: 'center',
    marginBottom: verticalScale(8),
    borderWidth: 1.5,
    width: wp(50),
    borderColor: '#0D326F',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    margin: 'auto'
  },

  loadMoreButtonText: {
    ...commonTextStyle,
    color: '#0D326F',
    fontSize: RFValue(14),
    fontWeight: '600',
  },

  // 모달 스타일
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalView: {

    flex: 1,
    backgroundColor: '#fff',

    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    width: wp('90%'),
    maxHeight: hp('80%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  receiptContainer: {
    flex: 1,
  },

  header: {
    marginBottom: verticalScale(16),
  },

  headerTitle: {
    ...commonTextStyle,
    fontSize: RFValue(20),
    fontWeight: '700',
    color: '#0D326F',
    marginBottom: verticalScale(4),
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    paddingBottom: moderateScale(10),
  },

  headerSubtitle: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    color: '#666666',
    textAlign: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: verticalScale(16),
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(8),
  },

  itemRowLeft: {
    flex: 1,
  },

  itemName: {
    ...commonTextStyle,
    fontSize: RFValue(15),
    fontWeight: '600',
    color: '#1A1A1A',
  },

  itemQty: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    color: '#666666',
    marginTop: verticalScale(4),
  },

  itemPrice: {
    ...commonTextStyle,
    fontSize: RFValue(15),
    fontWeight: '600',
    color: '#0D326F',
  },

  footer: {
    marginTop: verticalScale(16),
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    padding: moderateScale(16),
    borderRadius: moderateScale(8),
  },

  footerText: {
    ...commonTextStyle,
    fontSize: RFValue(18),
    fontWeight: '700',
    color: '#0D326F',
  },

  closeButton: {
    backgroundColor: '#0D326F',
    borderRadius: moderateScale(25),
    padding: moderateScale(12),
    elevation: 2,
    alignItems: 'center',
    marginTop: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  textStyle: {
    ...commonTextStyle,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: RFValue(16),
  },

  // 기간 선택 모달 스타일
  periodModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  periodModalInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(24),
    width: wp('90%'),
    maxHeight: hp('80%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },

  periodModalTitle: {
    ...commonTextStyle,
    fontSize: RFValue(18),
    fontWeight: '700',
    color: '#0D326F',
    marginBottom: verticalScale(16),
    paddingBottom: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  dateGroup: {
    marginBottom: verticalScale(16),
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  dateGroupLabel: {
    ...commonTextStyle,
    fontSize: RFValue(15),
    fontWeight: '600',
    color: '#0D326F',
    marginBottom: verticalScale(12),
    paddingLeft: moderateScale(6),
    borderLeftWidth: 3,
    borderLeftColor: '#0D326F',
  },

  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(8),
  },

  dateBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    height: verticalScale(42),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  dateBoxText: {
    ...commonTextStyle,
    fontSize: RFValue(13),
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '500',
  },

  dropdown: {
    position: 'absolute',
    top: verticalScale(44),
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 1000,
    overflow: 'hidden',
  },

  dropdownOpen: {
    maxHeight: verticalScale(150),
  },

  dropdownScroll: {
    maxHeight: verticalScale(150),
  },

  dropdownItem: {
    padding: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },

  periodSearchButton: {
    backgroundColor: '#0D326F',
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(25),
    alignItems: 'center',
    marginTop: verticalScale(20),
    width: wp('40%'),
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  periodSearchButtonText: {
    ...commonTextStyle,
    color: '#FFFFFF',
    fontSize: RFValue(15),
    fontWeight: '600',
  },

  resetButton: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(25),
    borderWidth: 1,
    borderColor: '#DC3545',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  resetButtonText: {
    ...commonTextStyle,
    color: '#DC3545',
    fontSize: RFValue(13),
    fontWeight: '600',
  },

  dropdownWrapper: {
    position: 'relative',
    flex: 1,
    zIndex: 1,
  },

  confirmButton: {
    backgroundColor: '#0D326F',
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(12),
    marginTop: verticalScale(10),
    alignSelf: 'center',
    width: wp('22%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  confirmButtonText: {
    ...commonTextStyle,
    color: '#FFFFFF',
    fontSize: RFValue(12),
    fontWeight: '600',
    textAlign: 'center',
  },

  datePickerModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  datePickerModal: {
    width: wp('90%'),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  datePickerTitle: {
    ...commonTextStyle,
    fontSize: RFValue(18),
    fontWeight: '700',
    color: '#0D326F',
    marginBottom: verticalScale(16),
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: moderateScale(10),
    width: '100%',
  },

  datePickerLabel: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    fontWeight: '600',
    color: '#0D326F',
    marginVertical: verticalScale(8),
    alignSelf: 'flex-start',
    paddingLeft: moderateScale(4),
    borderLeftWidth: 3,
    borderLeftColor: '#0D326F',
  },

  pickerItem: {
    backgroundColor: '#f8f9fa',
    paddingVertical: verticalScale(8),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pickerItemActive: {
    backgroundColor: '#0D326F',
    borderColor: '#0D326F',
  },

  itemRowRight: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
});

export const dateRangeStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    ...commonTextStyle,
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: wp(420),
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
    borderBottomWidth: moderateScale(1),
    borderBottomColor: '#eaeaea',
    marginBottom: moderateScale(20),
  },
  modalTitle: {
    ...commonTextStyle,
    fontSize: RFValue(18),
    fontWeight: '600',
    color: '#0a3172',
  },
  closeButton: {
    ...commonTextStyle,
    padding: moderateScale(5),
  },
  closeButtonText: {
    ...commonTextStyle,
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
    borderRadius: 20,
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    marginRight: moderateScale(8),
  },
  activePresetButton: {
    backgroundColor: '#e0eaf9',
    borderColor: '#0a3172',
  },
  presetButtonText: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    color: '#000',
  },
  activePresetButtonText: {
    ...commonTextStyle,
    color: '#0a3172',
  },
  dateRangeSection: {
    ...commonTextStyle,
    marginBottom: moderateScale(20),
  },
  dateRangeTitle: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: '500',
    color: '#333',
    marginBottom: moderateScale(12),
  },
  dateRangeContainer: {
    borderWidth: 1,
    borderColor: '#d0dae9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  dateRangeHeader: {
    flexDirection: 'row',
    padding: moderateScale(12),
    backgroundColor: '#f0f4f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePart: {
    alignItems: 'center',
  },
  dateLabel: {
    ...commonTextStyle,
    fontSize: RFValue(12),
    color: '#666',
    marginBottom: moderateScale(4),
  },
  dateValue: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: '500',
    color: '#0a3172',
  },
  dateSeparator: {
    ...commonTextStyle,
    marginHorizontal: moderateScale(10),
    color: '#666',
    fontWeight: '500',
  },
  pickerContainer: {
    ...commonTextStyle,
    marginBottom: moderateScale(16),
  },
  pickerTitle: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    color: '#333',
    marginBottom: moderateScale(4),
    fontWeight: '500',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  picker: {
    flex: 1,
    height: hp(44),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: '#d0dae9',
    borderRadius: 6,
    flexGrow: 1,
    backgroundColor: 'white',
    marginHorizontal: moderateScale(4),
  },
  searchButton: {
    width: '100%',
    padding: moderateScale(14),
    backgroundColor: '#0a3172',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: moderateScale(10),
  },
  searchButtonText: {
    ...commonTextStyle,
    color: 'white',
    fontSize: RFValue(16),
    fontWeight: '500',
  },
  formContainer: {
    marginVertical: moderateScale(20),
    paddingHorizontal: moderateScale(10),
  },
});
