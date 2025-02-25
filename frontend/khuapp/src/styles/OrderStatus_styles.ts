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
    backgroundColor: '#F8F9FA',
    padding: moderateScale(16),
  },
  
  // 헤더 스타일
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
    backgroundColor: '#fff',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  
  sectionTitle: {
    flex: 1,
  },
  
  title: {
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
    fontSize: RFValue(16),
    color: '#666666',
    fontWeight: '500',
  },

  // 리스트 스타일
  flatlist: {
    flex: 1,
  },

  yearHeader: {
    fontSize: RFValue(20),
    fontWeight: '700',
    color: '#0D326F',
    marginBottom: verticalScale(16),
    marginTop: verticalScale(24),
    paddingLeft: moderateScale(10),
    borderLeftWidth: 4,
    borderLeftColor: '#0D326F',
  },

  monthContainer: {
    marginBottom: verticalScale(16),
  },

  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
    backgroundColor: '#fff',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  monthTitle: {
    fontSize: RFValue(18),
    fontWeight: '600',
    color: '#1A1A1A',
  },

  monthTotal: {
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
    fontSize: RFValue(16),
    fontWeight: '600',
    color: '#1A1A1A',
  },

  weekTotal: {
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
    fontSize: RFValue(15),
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: verticalScale(4),
  },

  extraCount: {
    fontSize: RFValue(14),
    color: '#666666',
    marginBottom: verticalScale(4),
  },

  quantity: {
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
    color: '#0D326F',
    fontSize: RFValue(14),
    fontWeight: '600',
  },

  loadMoreButton: {
    backgroundColor: '#FFFFFF',
    padding: moderateScale(12),
    borderRadius: moderateScale(25),
    alignItems: 'center',
    marginVertical: verticalScale(16),
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

  loadMoreButtonText: {
    color: '#0D326F',
    fontSize: RFValue(14),
    fontWeight: '600',
  },

  // 모달 스타일
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalView: {
    backgroundColor: '#FFFFFF',
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
    fontSize: RFValue(15),
    fontWeight: '600',
    color: '#1A1A1A',
  },

  itemQty: {
    fontSize: RFValue(14),
    color: '#666666',
    marginTop: verticalScale(4),
  },

  itemPrice: {
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
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: RFValue(16),
  },

  // 기간 선택 모달 스타일
  periodModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  periodModalInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    width: wp('90%'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  periodModalTitle: {
    fontSize: RFValue(20),
    fontWeight: '700',
    color: '#0D326F',
    marginBottom: verticalScale(20),
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    paddingBottom: moderateScale(10),
  },

  dateGroup: {
    marginBottom: verticalScale(20),
  },

  dateGroupLabel: {
    fontSize: RFValue(16),
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: verticalScale(8),
  },

  dateRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },

  dateBox: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  dateBoxText: {
    fontSize: RFValue(14),
    color: '#1A1A1A',
    textAlign: 'center',
  },

  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    elevation: 5,
    zIndex: 1000,
  },

  dropdownOpen: {
    maxHeight: verticalScale(200),
  },

  dropdownScroll: {
    maxHeight: verticalScale(200),
  },

  dropdownItem: {
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },

  periodSearchButton: {
    backgroundColor: '#0D326F',
    padding: moderateScale(12),
    borderRadius: moderateScale(25),
    alignItems: 'center',
    marginTop: verticalScale(20),
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
    color: '#FFFFFF',
    fontSize: RFValue(16),
    fontWeight: '600',
  },

  resetButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
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

  resetButtonText: {
    color: '#FFFFFF',
    fontSize: RFValue(14),
    fontWeight: '600',
  },

  // 드롭다운 관련 스타일
  dropdownWrapper: {
    position: 'relative',
    marginHorizontal: moderateScale(4),
    zIndex: 1,
  },

  confirmButton: {
    backgroundColor: '#0D326F',
    borderRadius: moderateScale(25),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    marginTop: verticalScale(10),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: RFValue(14),
    fontWeight: '600',
    textAlign: 'center',
  },

  // 날짜 선택 모달 스타일
  datePickerModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  datePickerModal: {
    width: wp('90%'),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  datePickerTitle: {
    fontSize: RFValue(20),
    fontWeight: '700',
    color: '#0D326F',
    marginBottom: verticalScale(10),
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    paddingBottom: moderateScale(10),
    width: '100%',
  },

  datePickerLabel: {
    fontSize: RFValue(14),
    fontWeight: '600',
    color: '#1A1A1A',
    marginVertical: verticalScale(6),
    alignSelf: 'flex-start',
  },

  pickerItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    marginRight: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E5E5E5',
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
