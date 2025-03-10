import { StyleSheet, Dimensions, TextStyle, Platform } from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { RFValue } from "react-native-responsive-fontsize";

const { height: screenHeight } = Dimensions.get("window");

// 디바이스 체크 함수
const isTablet = () => {
  const { width, height } = Dimensions.get("window");
  return width >= 768 || height >= 768;
};

const commonTextStyle = (customStyle: Partial<TextStyle> = {}): TextStyle => ({
  fontFamily: "PretendardVariable",
  fontWeight: customStyle.fontWeight ? customStyle.fontWeight : "400",
  ...customStyle,
});

export const homescreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: moderateScale(16),
    paddingTop: moderateScale(0),
    paddingBottom: moderateScale(0),
  },

  header: {
    // marginBottom: verticalScale(20),
    alignItems: "center",
  },

  title: {
    ...commonTextStyle({
      fontWeight: "600",
    }),
    fontSize: RFValue(18),
    color: "#0D326F",
    marginVertical: verticalScale(8),
  },

  subtitle: {
    ...commonTextStyle(),
    fontSize: RFValue(14),
    color: "#64748b",
    marginBottom: verticalScale(16),
  },

  // 로딩 및 데이터 없음 텍스트
  loadingText: {
    ...commonTextStyle(),
    fontSize: RFValue(14),
    color: "#64748b",
    textAlign: "center",
    marginTop: verticalScale(20),
  },

  noDataText: {
    ...commonTextStyle(),
    fontSize: RFValue(14),
    color: "#64748b",
    textAlign: "center",
    marginVertical: verticalScale(20),
    fontStyle: "italic",
  },

  // 섹션 컨테이너 스타일
  sectionContainer: {
    marginBottom: verticalScale(10),
    backgroundColor: "#fff",
    borderRadius: moderateScale(10),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },

  sectionTitle: {
    ...commonTextStyle({
      fontWeight: "600",
    }),
    fontSize: RFValue(15),
    color: "#0D326F",
    backgroundColor: "#f8fafc",
    paddingVertical: verticalScale(6),
    // paddingLeft: moderateScale(10), // 중앙 정렬을 원하면 이 속성을 제거하거나 수정하세요.
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  // 차트 컨테이너 스타일
  chartContainer: {
    padding: moderateScale(0),
    paddingBottom: verticalScale(8),
    paddingTop: verticalScale(5),
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(8),
    // 태블릿과 모바일에 따라 다르게 패딩 적용
    paddingLeft: moderateScale(0),
    paddingRight: isTablet() ? moderateScale(20) : moderateScale(15), // 오른쪽 여백 추가
    // 가로 모드를 위한 최대 너비 설정
    maxWidth: isTablet() ? 1024 : "100%",
    alignSelf: "center",
    width: "100%", // 너비를 100%로 설정
  },

  // 범례 관련 스타일
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    // marginTop: verticalScale(10),
    // marginBottom: verticalScale(10),
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: moderateScale(3),
  },

  legendColor: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(6),
    marginRight: moderateScale(5),
  },

  legendText: {
    ...commonTextStyle(),
    fontSize: RFValue(8),
    color: "#64748b",
  },

  // 차트 단위 텍스트 스타일
  chartUnitText: {
    ...commonTextStyle(),
    fontSize: RFValue(9),
    color: "#888888",
    textAlign: "right",
    alignSelf: "flex-end",
    // marginRight: moderateScale(15),
    // marginTop: verticalScale(8),
    marginBottom: verticalScale(10),
    position: "relative",
    left: wp(4),
  },

  // 차트와 데이터를 감싸는 부모 컨테이너
  chartDataContainer: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#eaeaea",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: verticalScale(3),
    marginHorizontal: moderateScale(2),
    overflow: "hidden",
  },

  // 비교 컨테이너 스타일
  comparisonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: moderateScale(16),
    backgroundColor: "#f8fafc",
    // borderTopWidth: 1,
    // borderTopColor: '#e2e8f0',
  },

  comparisonItem: {
    flex: 1,
    alignItems: "center",
  },

  comparisonLabel: {
    ...commonTextStyle({
      fontWeight: "500",
    }),
    fontSize: RFValue(12),
    color: "#64748b",
    // marginBottom: verticalScale(4),
  },

  comparisonValue: {
    ...commonTextStyle({
      fontWeight: "500",
    }),
    fontSize: RFValue(13),
    color: "#0D326F",
  },

  // 버튼 컨테이너 스타일
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: verticalScale(16),
    paddingHorizontal: moderateScale(4),
  },

  rightButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerButton: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
    backgroundColor: "#f1f5f9",
    marginLeft: moderateScale(8),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  headerButtonActive: {
    backgroundColor: "#0D326F",
    borderColor: "#0D326F",
  },

  headerButtonText: {
    ...commonTextStyle({
      fontWeight: "500",
    }),
    fontSize: RFValue(12),
    color: "#64748b",
  },

  headerButtonTextActive: {
    color: "#FFFFFF",
  },

  // 월별 상세보기 테이블 스타일
  monthlyTableContainer: {
    // marginBottom: verticalScale(16),
    // borderRadius: moderateScale(10),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    width: "100%",
    backgroundColor: "#fff",
  },

  monthlyTableHeader: {
    flexDirection: "row",
    backgroundColor: "#0D326F",
    borderTopLeftRadius: moderateScale(10),
    borderTopRightRadius: moderateScale(10),
    alignItems: "center",
    minHeight: verticalScale(48),
    width: "100%",
    justifyContent: "space-between",
  },

  monthlyTableHeaderText: {
    ...commonTextStyle({
      fontWeight: "600",
    }),
    fontSize: RFValue(13),
    color: "#FFFFFF",
    textAlign: "center",
    flexShrink: 0,
    flexWrap: "nowrap",
    minWidth: wp("10%"),
    letterSpacing: -0.5,
  },

  monthlyTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    minHeight: verticalScale(44),
    width: "100%",
    justifyContent: "space-between",
  },

  monthlyTableCell: {
    ...commonTextStyle(),
    fontSize: RFValue(13),
    color: "#1e293b",
    textAlign: "center",
    letterSpacing: -0.5,
    flexShrink: 0,
    minWidth: wp("10%"),
    flexWrap: "wrap",
    // minHeight: verticalScale(36),
  },

  monthlyTableCellHighlight: {
    ...commonTextStyle({
      fontWeight: "600",
    }),
    fontSize: RFValue(13),
    color: "#0D326F",
    textAlign: "center",
    flexShrink: 0,
    minWidth: wp("10%"),
    paddingHorizontal: moderateScale(2),
    flexWrap: "wrap",
    minHeight: verticalScale(36),
    letterSpacing: -0.5,
  },

  weekColumn: {
    flex: 0.9,
    alignItems: "center",
    justifyContent: "center",
    minWidth: wp("9%"),
    borderLeftWidth: 1,
    borderLeftColor: "#e2e8f0",
  },

  productColumn: {
    flex: 2.8,
    paddingLeft: moderateScale(10),
    justifyContent: "center",
    minWidth: wp("32%"),
  },

  quantityColumn: {
    flex: 0.9,
    alignItems: "center",
    justifyContent: "center",
    minWidth: wp("10%"),
    borderRightWidth: 0,
    borderRightColor: "#e2e8f0",
  },

  // 요약 섹션 스타일
  summarySection: {
    backgroundColor: "#ffffff",
    paddingBottom: moderateScale(0),
    paddingTop: moderateScale(0),
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
  },

  summaryTitle: {
    ...commonTextStyle({
      fontWeight: "600",
    }),
    fontSize: RFValue(17),
    color: "#0D326F",
    marginBottom: moderateScale(14),
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: moderateScale(10),
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: moderateScale(9),
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  summaryLabel: {
    ...commonTextStyle({
      // fontWeight: '500',
    }),
    fontSize: RFValue(14),
    // color: '#64748b',
    textAlign: "center",
  },

  summaryValue: {
    ...commonTextStyle({
      // fontWeight: '600',
    }),
    fontSize: RFValue(14),
    color: "#0D326F",
    textAlign: "right",
  },

  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: moderateScale(14),
    marginTop: moderateScale(6),
    backgroundColor: "#EFF6FF",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
  },

  summaryTotalLabel: {
    ...commonTextStyle({
      fontWeight: "600",
    }),
    fontSize: RFValue(14),
    color: "#0D326F",
    textAlign: "left",
  },

  summaryTotalValue: {
    ...commonTextStyle({
      fontWeight: "500",
    }),
    fontSize: RFValue(15),
    color: "#0D326F",
    textAlign: "right",
  },

  // 요약 헤더 스타일
  summaryHeader: {
    padding: verticalScale(8),
    marginBottom: verticalScale(4),
    marginTop: verticalScale(0),
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  summaryHeaderText: {
    ...commonTextStyle({
      fontWeight: "600",
    }),
    fontSize: RFValue(15),
    color: "#0D326F",
    textAlign: "center",
  },

  // 테이블 스타일
  summaryTable: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#fff",
    borderBottomWidth: 0,
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e9e9e9",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    minHeight: verticalScale(45),
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(8),
  },

  tableRowEven: {
    backgroundColor: "#FFFFFF",
  },

  tableRowOdd: {
    backgroundColor: "#F8FAFC",
  },

  tableCell: {
    flex: 1,
    padding: verticalScale(8),
    justifyContent: "center",
    alignItems: "center",
  },

  amountCell: {
    flex: 1,
    padding: verticalScale(8),
    justifyContent: "center",
    alignItems: "flex-end",
  },

  monthHeaderCell: {
    flex: 1,
    padding: verticalScale(8),
    justifyContent: "center",
    alignItems: "center",
  },

  weekCell: {
    flex: 0.8,
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },

  tableHeaderText: {
    ...commonTextStyle({
      fontWeight: "600",
    }),
    fontSize: RFValue(14),
    color: "#0D326F",
    textAlign: "right",
  },

  tableFooter: {
    backgroundColor: "#E6EFF9",
    borderTopWidth: 1,
    borderTopColor: "#CBD5E1",
  },
});

// DateRangeModal 스타일
export const dateRangeStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  modalContainer: {
    backgroundColor: "white",
    borderRadius: moderateScale(12),
    width: "90%",
    maxWidth: wp("90%"),
    padding: moderateScale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    marginBottom: moderateScale(10),
  },

  modalTitle: {
    ...commonTextStyle({
      fontWeight: "600",
    }),
    fontSize: RFValue(18),
    color: "#0D326F",
  },

  closeButton: {
    padding: moderateScale(5),
  },

  closeButtonText: {
    ...commonTextStyle(),
    fontSize: RFValue(20),
    color: "#666",
  },

  presetButtons: {
    flexDirection: "row",
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(8),
  },

  presetButton: {
    backgroundColor: "#f0f4f9",
    borderWidth: 1,
    borderColor: "#d0dae9",
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    marginRight: moderateScale(8),
  },

  activePresetButton: {
    backgroundColor: "#e0eaf9",
    borderColor: "#0D326F",
  },

  presetButtonText: {
    ...commonTextStyle(),
    fontSize: RFValue(14),
    color: "#000",
  },

  activePresetButtonText: {
    ...commonTextStyle(),
    color: "#0D326F",
  },

  searchButton: {
    width: "100%",
    padding: moderateScale(14),
    backgroundColor: "#0D326F",
    borderRadius: moderateScale(8),
    alignItems: "center",
    marginTop: moderateScale(10),
  },

  searchButtonText: {
    ...commonTextStyle({
      fontWeight: "600",
    }),
    color: "white",
    fontSize: RFValue(16),
  },
});
