import { StyleSheet, Dimensions, TextStyle } from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { RFValue } from "react-native-responsive-fontsize";

const { height: screenHeight } = Dimensions.get("window");

const commonTextStyle = (customStyle: Partial<TextStyle> = {}): TextStyle => ({
  fontFamily: "PretendardVariable",
  fontWeight: customStyle.fontWeight ? customStyle.fontWeight : "400",
  ...customStyle,
});

export const orderStatusStyles = StyleSheet.create({
  status_container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: moderateScale(10),
    paddingTop: verticalScale(0),
    paddingBottom: verticalScale(0),
  },

  // 헤더 스타일
  headerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(4),
    backgroundColor: "#fff",
    padding: moderateScale(12),
    paddingBottom: verticalScale(2),
    paddingLeft: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
  },

  sectionTitle: {
    flex: 1,
    alignItems: "center",
  },

  title: {
    ...commonTextStyle,
    fontSize: RFValue(18),
    fontWeight: "700",
    color: "#0D326F",
    textAlign: "center",
  },

  // 버튼 컨테이너 추가
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    // marginBottom: verticalScale(8),
    marginTop: verticalScale(0),
    // paddingRight: moderateScale(10),
    paddingBottom: verticalScale(1),
  },

  rightButtonGroup: {
    flexDirection: "row",
    gap: moderateScale(3),
    marginRight: moderateScale(9),
  },

  headerButton: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(5),
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#0D326F",
    borderRadius: moderateScale(8),
    justifyContent: "center", // 수직 중앙 정렬
    alignItems: "center", // 수평 중앙 정렬
    elevation: 1,
    shadowColor: "#0D326F",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  headerButtonText: {
    ...commonTextStyle,
    color: "#0D326F",
    fontSize: RFValue(11),
    fontWeight: "500",
  },

  headerButtonActive: {
    backgroundColor: "#0D326F",
  },

  headerButtonTextActive: {
    color: "#FFFFFF",
  },

  // 로딩 & 빈 상태
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    color: "#666666",
  },

  // 리스트 스타일
  flatlist: {
    flex: 1,
  },

  yearHeader: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: "600",
    color: "#0D326F",
    // marginBottom: verticalScale(8),
    // marginTop: verticalScale(10),
    marginLeft: moderateScale(10),
    paddingLeft: moderateScale(10),
    borderLeftWidth: 4,
    borderLeftColor: "#0D326F",
  },

  monthContainer: {
    // backgroundColor: '#f8f9fa',
    backgroundColor: "#fff",
    marginBottom: verticalScale(8),
    borderRadius: moderateScale(10),
    padding: moderateScale(8),
    paddingBottom: verticalScale(3),
    // paddingBottom: verticalScale(3),
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.05,
    // shadowRadius: 3,
    // elevation: 2,
  },

  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(16),
    paddingRight: moderateScale(2),
    backgroundColor: "#0D326F",
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(0),
  },

  monthTitle: {
    ...commonTextStyle,
    fontSize: RFValue(15),
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: moderateScale(0),
  },

  monthTotal: {
    ...commonTextStyle,
    fontSize: RFValue(15),
    fontWeight: "500",
    color: "#FFFFFF",
    marginRight: moderateScale(8),
  },

  weekContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    // padding: moderateScale(16),
    paddingBottom: verticalScale(4),
    paddingTop: verticalScale(3),
    paddingHorizontal: moderateScale(4),
    marginTop: verticalScale(3),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(3),
    paddingBottom: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    paddingHorizontal: moderateScale(8),
    paddingTop: verticalScale(8),
    borderRadius: moderateScale(6),
  },

  weekTitle: {
    ...commonTextStyle,
    fontSize: RFValue(15),
    fontWeight: "500",
    color: "#0D326F",
  },

  weekTotal: {
    ...commonTextStyle,
    fontSize: RFValue(15),
    fontWeight: "600",
    color: "#0D326F",
  },

  orderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  orderInfo: {
    flex: 1,
  },

  productName: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    color: "#1A1A1A",
    paddingLeft: moderateScale(5),
    // marginBottom: verticalScale(4),
  },

  extraCount: {
    ...commonTextStyle,
    fontSize: RFValue(12),
    color: "#666666",
    marginBottom: verticalScale(4),
    paddingLeft: moderateScale(5),
  },

  quantity: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    color: "#1A1A1A",
  },

  detailButton: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#0D326F",
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(10),
  },

  detailButtonText: {
    ...commonTextStyle,
    fontSize: RFValue(11),
    fontWeight: "500",
    color: "#0D326F",
  },

  loadMoreButton: {
    backgroundColor: "#FFFFFF",
    padding: moderateScale(12),
    borderRadius: moderateScale(25),
    alignItems: "center",
    marginBottom: verticalScale(8),
    borderWidth: 1.5,
    width: wp(50),
    borderColor: "#0D326F",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    margin: "auto",
  },

  loadMoreButtonText: {
    ...commonTextStyle,
    color: "#0D326F",
    fontSize: RFValue(14),
    fontWeight: "600",
  },

  // 모달 스타일
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: moderateScale(4),
  },

  modalView: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    paddingBottom: 0,
  },

  modalHeader: {
    // padding: moderateScale(10),
    // paddingBottom: verticalScale(0),
    // // paddingTop: verticalScale(0),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
    position: "relative",
    // paddingVertical: moderateScale(15),
    zIndex: 5,
    minHeight: verticalScale(60),
  },

  modalTitle: {
    ...commonTextStyle,
    fontSize: RFValue(18),
    fontWeight: "700",
    color: "#0D326F",
    textAlign: "center",
    width: "80%",
    // marginBottom: moderateScale(5),
    // paddingVertical: verticalScale(10),
    paddingTop: verticalScale(10),
  },

  closeButton: {
    position: "absolute",
    right: moderateScale(10),
    bottom: moderateScale(15),
    width: wp("7%"),
    height: wp("7%"),
    maxWidth: moderateScale(30),
    maxHeight: moderateScale(30),
    minWidth: moderateScale(24),
    minHeight: moderateScale(24),
    borderRadius: wp("3.5%"),
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  closeButtonText: {
    ...commonTextStyle,
    fontSize: RFValue(12),
    fontWeight: "600",
    color: "#64748b",
  },

  modalScrollView: {
    padding: moderateScale(5),
    paddingBottom: moderateScale(0),
    paddingTop: moderateScale(2),
    marginVertical: verticalScale(1),
  },

  modalOrderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    width: "100%",
    backgroundColor: "#ffffff",
    marginBottom: moderateScale(6),
    // borderRadius: moderateScale(6),
    minHeight: verticalScale(40),
  },

  modalOrderName: {
    ...commonTextStyle,
    flex: 3,
    fontSize: RFValue(14),
    paddingTop: verticalScale(4),
    color: "#1e293b",
    // fontWeight: '500',
    paddingRight: moderateScale(5),
    flexShrink: 1,
    letterSpacing: -0.3,
  },

  modalOrderDate: {
    ...commonTextStyle,
    fontSize: RFValue(12),
    color: "#64748b",
    marginTop: moderateScale(2),
  },

  modalOrderQuantity: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    // color: '#64748b',
    // fontWeight: '500',
    textAlign: "center",
    paddingHorizontal: moderateScale(2),
    minWidth: wp("15%"),
    flexShrink: 0,
  },

  modalOrderPrice: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    color: "#0D326F",
    // fontWeight: '600',
    textAlign: "right",
    minWidth: wp("20%"),
    paddingLeft: moderateScale(5),
    flexShrink: 0,
  },

  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: moderateScale(16),
    paddingBottom: moderateScale(20),
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    marginTop: moderateScale(5),
  },

  modalTotalCost: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: "600",
    color: "#0D326F",
  },

  // 기간 선택 모달 스타일
  periodModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  periodModalInner: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    padding: moderateScale(24),
    width: wp("90%"),
    maxHeight: hp("80%"),
    shadowColor: "#000",
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
    fontWeight: "700",
    color: "#0D326F",
    marginBottom: verticalScale(16),
    paddingBottom: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  dateGroup: {
    marginBottom: verticalScale(16),
    backgroundColor: "#f8f9fa",
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
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
    fontWeight: "600",
    color: "#0D326F",
    marginBottom: verticalScale(12),
    paddingLeft: moderateScale(6),
    borderLeftWidth: 3,
    borderLeftColor: "#0D326F",
  },

  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: moderateScale(8),
  },

  dateBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(42),
    shadowColor: "#000",
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
    color: "#1A1A1A",
    textAlign: "center",
  },

  dropdown: {
    position: "absolute",
    top: verticalScale(44),
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#d1d5db",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 1000,
    overflow: "hidden",
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
    borderBottomColor: "#E5E5E5",
  },

  periodSearchButton: {
    backgroundColor: "#0D326F",
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(25),
    alignItems: "center",
    marginTop: verticalScale(20),
    width: wp("40%"),
    alignSelf: "center",
    shadowColor: "#000",
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
    color: "#FFFFFF",
    fontSize: RFValue(15),
    fontWeight: "600",
  },

  resetButton: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(25),
    borderWidth: 1,
    borderColor: "#DC3545",
    shadowColor: "#000",
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
    color: "#DC3545",
    fontSize: RFValue(13),
    fontWeight: "600",
  },

  dropdownWrapper: {
    position: "relative",
    flex: 1,
    zIndex: 1,
  },

  confirmButton: {
    backgroundColor: "#0D326F",
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(12),
    marginTop: verticalScale(10),
    alignSelf: "center",
    width: wp("22%"),
    shadowColor: "#000",
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
    color: "#FFFFFF",
    fontSize: RFValue(12),
    fontWeight: "600",
    textAlign: "center",
  },

  datePickerModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  datePickerModal: {
    width: wp("90%"),
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    padding: moderateScale(24),
    alignItems: "center",
    shadowColor: "#000",
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
    fontWeight: "700",
    color: "#0D326F",
    marginBottom: verticalScale(16),
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: moderateScale(10),
    width: "100%",
  },

  datePickerLabel: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    fontWeight: "600",
    color: "#0D326F",
    marginVertical: verticalScale(8),
    alignSelf: "flex-start",
    paddingLeft: moderateScale(4),
    borderLeftWidth: 3,
    borderLeftColor: "#0D326F",
  },

  pickerItem: {
    backgroundColor: "#f8f9fa",
    paddingVertical: verticalScale(8),
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
  },

  pickerItemActive: {
    backgroundColor: "#0D326F",
    borderColor: "#0D326F",
  },

  itemRowRight: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },

  // 월별 상세보기 표 스타일
  monthlyTableContainer: {
    marginBottom: verticalScale(12),
    borderRadius: moderateScale(8),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    width: "100%",
  },

  monthlyTableHeader: {
    flexDirection: "row",
    // paddingVertical: moderateScale(10),
    // paddingHorizontal: moderateScale(4),
    backgroundColor: "#0D326F",
    borderTopLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
    alignItems: "center",
    minHeight: verticalScale(45),
    width: "100%",
    justifyContent: "space-between",
    // borderBottomWidth: 1,
    // borderBottomColor: '#e2e8f0',
  },

  monthlyTableHeaderText: {
    ...commonTextStyle,
    fontSize: RFValue(12),
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    flexShrink: 0,
    flexWrap: "nowrap",
    // paddingHorizontal: moderateScale(2),
    minWidth: wp("10%"),
    letterSpacing: -0.8,
  },

  monthlyTableRow: {
    flexDirection: "row",
    // paddingVertical: moderateScale(8),
    // paddingHorizontal: moderateScale(4),
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    minHeight: verticalScale(40),
    width: "100%",
    justifyContent: "space-between",
  },

  monthlyTableCell: {
    ...commonTextStyle,
    fontSize: RFValue(12),
    color: "#1e293b",
    textAlign: "center",
    letterSpacing: -0.8,
    flexShrink: 0,
    minWidth: wp("10%"),
    // paddingHorizontal: moderateScale(2),
    flexWrap: "wrap",
    // minHeight: verticalScale(36),
  },

  monthlyTableCellHighlight: {
    ...commonTextStyle,
    fontSize: RFValue(12),
    fontWeight: "600",
    color: "#0D326F",
    textAlign: "center",
    flexShrink: 0,
    minWidth: wp("10%"),
    paddingHorizontal: moderateScale(2),
    flexWrap: "wrap",
    // minHeight: verticalScale(36),
    letterSpacing: -0.8,
  },

  weekColumn: {
    flex: 0.8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: wp("8%"),
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },

  productColumn: {
    flex: 2.5,
    paddingLeft: moderateScale(8),
    justifyContent: "center",
    minWidth: wp("30%"),
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },

  quantityColumn: {
    flex: 0.8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: wp("10%"),
    borderRightWidth: 0,
    borderRightColor: "#e2e8f0",
  },

  priceColumn: {
    flex: 1,
    alignItems: "center",
    paddingRight: moderateScale(4),
    minWidth: wp("12%"),
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },

  summarySection: {
    marginTop: moderateScale(0),
    backgroundColor: "#f8fafc",
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: moderateScale(10),
  },

  summaryTitle: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: "600",
    color: "#0D326F",
    marginBottom: moderateScale(12),
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: moderateScale(8),
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  summaryLabel: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    color: "#64748b",
    fontWeight: "500",
  },

  summaryValue: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    fontWeight: "600",
    color: "#0D326F",
  },

  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: moderateScale(12),
    marginTop: moderateScale(4),
    backgroundColor: "#EFF6FF",
    borderRadius: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    marginBottom: moderateScale(5),
  },

  summaryTotalLabel: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: "600",
    color: "#0D326F",
  },

  summaryTotalValue: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: "700",
    color: "#0D326F",
  },

  yearContainer: {
    marginBottom: verticalScale(10),
  },
});

export const dateRangeStyles = StyleSheet.create({
  modalOverlay: {
    ...commonTextStyle,
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    ...commonTextStyle,
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    maxWidth: wp(420),
    padding: moderateScale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  modalHeader: {
    ...commonTextStyle,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: moderateScale(16),
    borderBottomWidth: moderateScale(1),
    borderBottomColor: "#eaeaea",
    marginBottom: moderateScale(10),
  },
  modalTitle: {
    ...commonTextStyle,
    fontSize: RFValue(18),
    fontWeight: "600",
    color: "#0a3172",
  },
  closeButton: {
    ...commonTextStyle,
    padding: moderateScale(5),
  },
  closeButtonText: {
    ...commonTextStyle,
    fontSize: RFValue(20),
    color: "#666",
  },
  presetButtons: {
    ...commonTextStyle,
    flexDirection: "row",
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(8),
  },
  presetButton: {
    ...commonTextStyle,
    backgroundColor: "#f0f4f9",
    borderWidth: 1,
    borderColor: "#d0dae9",
    borderRadius: 20,
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    marginRight: moderateScale(8),
  },
  activePresetButton: {
    ...commonTextStyle,
    backgroundColor: "#e0eaf9",
    borderColor: "#0a3172",
  },
  presetButtonText: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    color: "#000",
  },
  activePresetButtonText: {
    ...commonTextStyle,
    color: "#0a3172",
  },
  dateRangeSection: {
    ...commonTextStyle,
    marginBottom: moderateScale(20),
  },
  dateRangeTitle: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    color: "#333",
    marginBottom: moderateScale(12),
  },
  dateRangeContainer: {
    ...commonTextStyle,
    borderWidth: 1,
    borderColor: "#d0dae9",
    borderRadius: 8,
    overflow: "hidden",
  },
  dateRangeHeader: {
    ...commonTextStyle,
    flexDirection: "row",
    padding: moderateScale(12),
    backgroundColor: "#f0f4f9",
    alignItems: "center",
    justifyContent: "center",
  },
  datePart: {
    ...commonTextStyle,
    alignItems: "center",
  },
  dateLabel: {
    ...commonTextStyle,
    ...commonTextStyle,
    fontSize: RFValue(12),
    color: "#666",
    marginBottom: moderateScale(4),
  },
  dateValue: {
    ...commonTextStyle,
    ...commonTextStyle,
    fontSize: RFValue(16),
    color: "#0a3172",
  },
  dateSeparator: {
    ...commonTextStyle,
    ...commonTextStyle,
    marginHorizontal: moderateScale(10),
    color: "#666",
  },
  pickerContainer: {
    ...commonTextStyle,
    ...commonTextStyle,
    marginBottom: moderateScale(16),
  },
  pickerTitle: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    color: "#333",
    marginBottom: moderateScale(4),
  },
  pickerRow: {
    ...commonTextStyle,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  picker: {
    ...commonTextStyle,
    flex: 1,
    height: hp(6),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: "#d0dae9",
    borderRadius: 6,
    flexGrow: 1,
    backgroundColor: "white",
    marginHorizontal: moderateScale(4),
  },
  searchButton: {
    ...commonTextStyle,
    width: "100%",
    padding: moderateScale(14),
    backgroundColor: "#0a3172",
    borderRadius: 8,
    alignItems: "center",
    marginTop: moderateScale(10),
  },
  searchButtonText: {
    ...commonTextStyle,
    color: "white",
    fontSize: RFValue(16),
  },
  formContainer: {
    ...commonTextStyle,
    marginVertical: moderateScale(20),
    paddingHorizontal: moderateScale(10),
  },
});
