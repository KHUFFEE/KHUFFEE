// C:\Users\usert\Desktop\KHUFFEE\frontend\khuapp\src\components\ui\common\commonstyler.ts

// 수정해야함
import { Platform, TextInput, StyleSheet, Dimensions, Text, StatusBar } from 'react-native';
const { height: screenHeight } = Dimensions.get('window');
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { RFValue } from 'react-native-responsive-fontsize';
import { relative } from 'path';
import { Wheat } from 'lucide-react-native';
import { TextStyle } from 'react-native';

const commonTextStyle = (customStyle: Partial<TextStyle> = {}): TextStyle => ({
  fontFamily: 'PretendardVariable',
  fontWeight: customStyle.fontWeight ? customStyle.fontWeight : '400',
  ...customStyle,
});


export const styles = StyleSheet.create({
  // SafeArea 컨테이너 스타일
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    ...commonTextStyle
  },
  // login.tsx 밑 공통 compon
  dashboardContainer: {     // login.tsx, main.tsx , StoreEmployeeDashboard 사용 
    flex: 1,
    backgroundColor: '#fff',
    ...commonTextStyle
  },
  mainContent: {
    flex: 1,
    ...commonTextStyle

  },
  contentContainer: {      //login.tsx 사용 
    flex: 1,
    padding: moderateScale(20),
    justifyContent: 'center',
    ...commonTextStyle
  },
  logoContainer: {       //login.tsx 로고 
    alignItems: 'center',
    marginBottom: moderateScale(40),
    ...commonTextStyle
  },
  logo: {             //login.tsx 로고 이미지 크기 설정
    width: moderateScale(100),
    height: moderateScale(100),
    alignSelf: 'center',
    right: 10,
    marginBottom: moderateScale(-5),
    ...commonTextStyle
  },
  logo_name: {            //logo 아래 이름
    fontSize: RFValue(27),
    fontWeight: 600,
    marginBottom: moderateScale(-10),
    textAlign: 'center',
    color: '#8B0000',
    ...commonTextStyle
  },
  form_Container: {
    width: '100%',
    paddingHorizontal: moderateScale(20),
    backgroundColor: '',   //여기 바꾸면 부모 컨테이너 바뀜 
    ...commonTextStyle
  },

  // 개별 TextInput을 감싸는 컨테이너
  textboxContainer: {
    // 화면 높이의 35%를 상단 여백으로 사용 (필요에 따라 조정 가능)
    marginTop: screenHeight * 0.00005,
    opacity: 1,
    ...commonTextStyle
  },
  form_input_box: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#B5B5B5', // 원하는 테두리 색으로 변경
    borderRadius: 8,
    paddingHorizontal: moderateScale(15),
    marginBottom: moderateScale(5),
    backgroundColor: '#FFFFFF', // 내부 채우기를 흰색으로 설정
    ...commonTextStyle
  },
  login_errorText: {  // loginScreen.tsx에서 사용
    color: '#A40F16',
    fontWeight: 600,
    marginBottom: 0,
    textAlign: 'center',
    ...commonTextStyle
  },
  login_button: {   //gd
    width: '100%', // 버튼의 너비를 화면의 100%로 설정합니다.
    height: 50,   //버튼의 높이를 50 픽셀로 설정합니다.
    backgroundColor: '#0D326F',  // 버튼의 배경색을 지정합니다.
    borderRadius: 8,   // 버튼의 모서리를 둥글게 만들어 8 픽셀의 반경을 적용합니다.
    justifyContent: 'center',  // // 수직 중앙 정렬 (flexDirection: 'column'인 경우)
    alignItems: 'center', // 수평 중앙 정렬
    marginTop: moderateScale(5),  // 버튼 위쪽에 10 픽셀의 여백을 추가합니다.
    // iOS용 그림자 설정
    shadowColor: '#000',            // 그림자의 색상을 검정색으로 설정합니다.
    shadowOffset: { width: 0, height: 2 },  // 그림자의 위치를 버튼 아래쪽으로 2 픽셀 이동시킵니다.
    shadowOpacity: 0.15,            // 그림자의 투명도를 25%로 설정합니다.
    shadowRadius: 3.84,             // 그림자의 블러(퍼짐) 정도를 3.84로 설정합니다.
    
    // Android용 그림자 설정
    elevation: 5,                   // Android에서 그림자 효과를 주기 위해 5의 elevation 값을 설정합니다.
    ...commonTextStyle
  },

  login_buttonText: {
    color: '#ffffff',
    fontSize: RFValue(16),
    fontWeight: 'bold',
    ...commonTextStyle
  },

  //main.tsx 시작 
  //상단 바 관련
  head_Container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(10),
    paddingHorizontal: moderateScale(15),
    backgroundColor: '#ffffff',
    borderBottomWidth: 2.5,
    borderBottomColor: '#8B0000',
    width: '100%',
    ...commonTextStyle
  },
  head_storeNameText: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    color: 'black',
    flex: 1,
    marginRight: moderateScale(10),
    ...commonTextStyle
  },
  bottom_navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    paddingVertical: moderateScale(10),
    borderTopWidth: moderateScale(2.5),
    borderTopColor: '#8B0000',
    ...commonTextStyle
  },
  bottom_navButton: {
    alignItems: 'center',
    ...commonTextStyle
  },
  bottom_navText: {
    color: 'black',
    marginTop: moderateScale(4),
    ...commonTextStyle
  },
  bottom_activeNavText: {
    color: '#8B0000',
    fontWeight: 'bold',
    marginTop: moderateScale(4),
    ...commonTextStyle
  },
  bottom_Overlay: {
    flex: 1,
    backgroundColor: 'rgba(68, 60, 60, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    ...commonTextStyle
  },
  bottom_Container: {
    width: '80%',
    backgroundColor: '#ffffff',
    padding: moderateScale(20),
    borderRadius: moderateScale(10),
    elevation: 5,
    ...commonTextStyle
  },
  bottom_modal_Option: {
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    ...commonTextStyle
  },
  bottom_modalOptionText: {
    fontSize: RFValue(18),
    color: '#333',
    ...commonTextStyle
  },
  loading_Container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    ...commonTextStyle
  },
  loading_Text: {
    marginTop: moderateScale(3),
    fontSize: RFValue(16),
    fontWeight: '600',
    left: moderateScale(5),
    color: '#00000080',
    alignItems: 'center',
    ...commonTextStyle
  },

  // OrderRequest.tsx 관련 스타일
  selectItemCard: {
    ...commonTextStyle,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: moderateScale(10),
    padding: moderateScale(15),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedItemCard: {
    ...commonTextStyle,
    borderColor: '#0D326F',
    borderWidth: 2,
    backgroundColor: '#f8f9fa',
  },
  selectItemInfo: {
    ...commonTextStyle,
    marginBottom: 8,
  },
  selectItemName: {
    ...commonTextStyle,
    width: '60%',
    fontSize: RFValue(15),
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  unitText: {
    ...commonTextStyle,
    // width: '100%',
    fontSize: RFValue(12),
    color: '#555555',
    fontWeight: '500',
    textAlign: 'left',
    position: 'relative',
    width: wp(30),
    right: wp(5),
  },
  price_unit_Text: {
    ...commonTextStyle,
    width: '25%',
    fontSize: RFValue(15),
    fontWeight: '700',
    color: '#0D326F',
    textAlign: 'right',
  },
  columnCenteredView: {
    ...commonTextStyle,
    width: '30%',
    height: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column'
  },
  actionsContainer: {
    ...commonTextStyle,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  priceText: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    fontWeight: '600',
    color: '#0D326F',
    position: 'relative',
    left: wp(0.5)
  },
  orderButton: {
    ...commonTextStyle,
    width: wp(15),
    height: hp(4),
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#0D326F',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  orderButtonText: {
    ...commonTextStyle,
    color: '#0D326F',
    fontSize: RFValue(13),
    fontWeight: '700',
  },
  order_request_Button: {
    ...commonTextStyle,
    backgroundColor: '#0D326F',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  order_request_ButtonText: {
    ...commonTextStyle,
    color: 'white',
    fontSize: RFValue(16),
    fontWeight: 'bold',
  },
  removeButton: {
    ...commonTextStyle,
    width: 28,
    height: 28,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    // paddingVertical: moderateScale(6),
    borderBottomWidth: 2,
    // borderTopWidth: 2,
    borderBottomColor: 'rgba(139, 0, 0, 0.1)',
    // borderTopColor: 'rgba(139, 0, 0, 0.1)',
    width: '100%',
    paddingRight: moderateScale(8), // 오른쪽 패딩 줄임
  },
  item_headerText: {
    ...commonTextStyle,
    width: '60%',
    fontSize: RFValue(15),
    fontWeight: '700',
    color: '#0D326F',
    textAlign: 'left',
    letterSpacing: -0.3,
  },
  price_headerText: {
    ...commonTextStyle,
    width: '25%',
    fontSize: RFValue(15),
    fontWeight: '700',
    color: '#0D326F',
    textAlign: 'right',
    paddingRight: moderateScale(10),
  },

  listContainer: {
    ...commonTextStyle,
    marginTop: moderateScale(5),
    marginBottom: moderateScale(0),
  },
  scrollContainer: {
    ...commonTextStyle,
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(16),
  },
  fixedHeaderContainer: {
    ...commonTextStyle,
    backgroundColor: '#fff',
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(5),
    // borderBottomWidth: 1,
    // borderBottomColor: '#e2e8f0',
    zIndex: 10,
    shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.05,
    // shadowRadius: 4,
    // elevation: 2,
  },
  scrollContainerWithHeader: {
    ...commonTextStyle,
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  categorySection: {
    ...commonTextStyle,
    backgroundColor: '#ffffff',
    paddingVertical: moderateScale(15),
    // paddingHorizontal: moderateScale(10),
    marginBottom: moderateScale(15),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryList: {
    ...commonTextStyle,
    flexDirection: 'row',
    marginTop: moderateScale(10),
    paddingRight: moderateScale(16),
  },
  categoryButton: {
    ...commonTextStyle,
    marginHorizontal: scale(4),
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: 'white',
    borderColor: '#e2e8f0',
    borderWidth: scale(1),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonActive: {
    ...commonTextStyle,
    backgroundColor: '#0D326F',
    borderColor: '#0D326F',
  },
  categoryButtonText: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    fontWeight: '600',
    color: '#64748b',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },

  sectionTitle: {
    ...commonTextStyle,
    fontSize: RFValue(18),
    fontWeight: '700',
    color: '#0D326F',
    marginBottom: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#0D326F',
    paddingLeft: moderateScale(10),
    marginLeft: moderateScale(5)
  },
  sectionTitle_2: {
    ...commonTextStyle,
    fontSize: RFValue(18),
    fontWeight: '700',
    color: '#0D326F',
    marginBottom: moderateScale(0),
    paddingHorizontal: moderateScale(16),
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#0D326F',
    paddingLeft: moderateScale(10),
    marginLeft: moderateScale(5)
  },

  footerContainer: {
    ...commonTextStyle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    height: hp(10),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  footerPriceText: {
    ...commonTextStyle,
    color: '#0D326F',
    fontSize: RFValue(18),
    fontWeight: '700',
  },
  footerButton: {
    ...commonTextStyle,
    backgroundColor: '#0D326F',
    borderRadius: 25,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  footerButtonDisabled: {
    ...commonTextStyle,
    backgroundColor: '#94a3b8',
  },
  footerButtonText: {
    ...commonTextStyle,
    color: '#fff',
    fontSize: RFValue(16),
    fontWeight: '700',
  },
  selectedItemsSection: {
    ...commonTextStyle,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  totalRow: {
    ...commonTextStyle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: '#aaa',
    marginTop: 10,
  },
  contentContainerStyle: {
    ...commonTextStyle,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsSection: {
    ...commonTextStyle,
    paddingLeft: 8,
    marginBottom: screenHeight * 0.8,
  },
  productGrid: {
    ...commonTextStyle,
    flexDirection: 'column',
    paddingHorizontal: 5,
    justifyContent: 'space-between',
  },
  selectItemRow: {
    ...commonTextStyle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cardContent: {
    ...commonTextStyle,
    flexDirection: 'column',
    width: '100%',
    // height: hp(3)
  },
  selectItemRowContainer: {
    ...commonTextStyle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(2),
    paddingRight: moderateScale(6),
    paddingLeft: moderateScale(2),
  },
  selectedItemRowContainer: {
    ...commonTextStyle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(2),
    paddingRight: moderateScale(6),
    paddingLeft: moderateScale(2),
    marginTop: moderateScale(0)
  },
  selectItemCardFooter: {
    ...commonTextStyle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: moderateScale(15),
    paddingTop: moderateScale(8),
  },
  selectItemCardFooter_selected: {
    ...commonTextStyle,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: moderateScale(2),
    // top: moderateScale(500)
  },
  actionsContainer_selected: {
    ...commonTextStyle,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  additionalRowContainer: {

    // paddingTop: moderateScale(5)
    // 추가로 내부 요소들의 간격은 개별 스타일에서 조절
  },
  productInfoContainer: {
    ...commonTextStyle,
    height: hp(5), // 기존 카드 높이와 동일하게 설정 (필요 시 조정)
    justifyContent: 'center',
  },
  /**********
   * 액션 버튼 영역 관련 스타일
   **********/
  // 삭제 버튼이 왼쪽에 위치하도록 하기 위해, buttonsRow의 flexDirection을 'row-reverse'로 설정합니다.
  buttonsRow: {
    ...commonTextStyle,
    flexDirection: 'column',  // 기존 'row' 대신 'row-reverse'를 사용하여 삭제 버튼이 왼쪽에 오도록 함
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  quantityControlContainer: {
    ...commonTextStyle,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: moderateScale(25),
    overflow: 'hidden',
    marginRight: moderateScale(8),
    backgroundColor: '#f8fafc',
  },
  quantityButton: {
    ...commonTextStyle,
    width: wp(12),
    height: hp(5),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  quantityText: {
    ...commonTextStyle,
    fontSize: RFValue(15),
    fontWeight: '600',
    color: '#0D326F',
    textAlign: 'center',
    minWidth: wp(15),
    maxWidth: wp(20),
    height: hp(5),
    backgroundColor: '#fff',
  },
  deleteButton: {
    ...commonTextStyle,
    width: '10%',
    minWidth: moderateScale(30),
    height: '30%',
    minHeight: verticalScale(30),
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#ef4444',
    borderWidth: 3,
  },
  deleteButtonText: {
    ...commonTextStyle,
    color: '#0D326F',
    fontSize: RFValue(12),
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  disabledButton: {
    ...commonTextStyle,
    opacity: 0.3,
  },

  /** 에러 메시지 영역 **/
  errorContainer: {
    ...commonTextStyle,
    marginTop: hp(1),
    backgroundColor: '#fee2e2',
    borderRadius: moderateScale(8),
    padding: moderateScale(8),
    width: '100%',
  },
  errorText: {
    ...commonTextStyle,
    color: '#dc2626',
    fontSize: RFValue(12),
    fontWeight: '500',
  },
  priceContainer: {
    ...commonTextStyle,
    flex: 1,
    flexDirection: 'column',
    paddingBottom: moderateScale(40)
  },

  // 선택한 상품 확인 css 
  confirm_selectedItemsSection: {
    ...commonTextStyle,
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    backgroundColor: '#ffffff',
  },
  confirm_sectionTitle: {
    ...commonTextStyle,
    fontSize: RFValue(22),
    fontWeight: '700',
    color: '#0D326F',
    marginBottom: moderateScale(20),
    width: '100%',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    paddingBottom: moderateScale(15),
  },
  confirmationItemRow: {
    ...commonTextStyle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  confirm_selectItemName: {
    ...commonTextStyle,
    flex: 3,
    fontSize: RFValue(16),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: moderateScale(4),
    width: '100%',
  },
  confirm_unitText: {
    ...commonTextStyle,
    flex: 0.7,
    fontSize: RFValue(14),
    color: '#64748b',
    fontWeight: '500',
  },
  confirm_priceText: {
    ...commonTextStyle,
    fontSize: RFValue(15),
    fontWeight: '700',
    color: '#0D326F',
  },
  confirm_totalRow: {
    ...commonTextStyle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(10),
    borderTopWidth: 2,
    borderColor: '#e2e8f0',
    marginTop: moderateScale(15),
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(8),
  },
  totalText: {
    ...commonTextStyle,
    color: '#0D326F',
    fontSize: RFValue(18),
    fontWeight: '700',
  },

  container: {
    ...commonTextStyle,
    flex: 1,
    padding: moderateScale(20),
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: moderateScale(16),
    ...commonTextStyle
  },
  filterContainer: {
    ...commonTextStyle,
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  sortButton: {
    ...commonTextStyle,
    justifyContent: 'center',
    alignItems: 'center',
    width: 79,
    height: 40,
    backgroundColor: 'white',
    borderColor: "#0D326F",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  headerRow: {
    ...commonTextStyle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: moderateScale(5),
    paddingRight: moderateScale(-5),
    paddingBottom: moderateScale(-8),
  },
  titleContainer: {
    ...commonTextStyle,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightButtonGroup: {
    ...commonTextStyle,
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodModalContainer: {
    ...commonTextStyle,
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodModalInner: {
    ...commonTextStyle,
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    overflow: 'visible',
  },
  periodModalTitle: {
    ...commonTextStyle,
    fontSize: RFValue(18),
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateGroup: {
    ...commonTextStyle,
    flex: 1,
    alignItems: 'center',
    marginTop: 12,
  },
  dateGroupLabel: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: 'bold',
    marginBottom: 6,
  },
  dateRow: {
    ...commonTextStyle,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  dateBox: {
    ...commonTextStyle,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 5,
    width: 75,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBoxText: {
    ...commonTextStyle,
    fontSize: RFValue(15),
    fontWeight: '600',
  },
  dropdownWrapper: {
    ...commonTextStyle,
    position: 'relative',
    marginHorizontal: 4,
    zIndex: 1,
  },
  dropdown: {
    ...commonTextStyle,
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    zIndex: 10,
    elevation: 10,
  },
  dropdownOpen: {
    ...commonTextStyle,
    zIndex: 9999,
    elevation: 9999,
  },
  dropdownItem: {
    ...commonTextStyle,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownScroll: {
    ...commonTextStyle,
    maxHeight: 180,
  },
  periodSearchButton: {
    ...commonTextStyle,
    backgroundColor: '#0D326F',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  periodSearchButtonText: {
    ...commonTextStyle,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadMoreButton: {
    ...commonTextStyle,
    alignSelf: 'center',
    marginVertical: moderateScale(10),
    backgroundColor: '#0D326F',
    borderRadius: 8,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
  },
  loadMoreButtonLoading: {
    ...commonTextStyle,
    backgroundColor: 'transparent',
  },
  loadMoreButtonText: {
    ...commonTextStyle,
    color: '#fff',
    fontSize: RFValue(16),
    fontWeight: 'bold',
  },
  datePickerModalContainer: {
    ...commonTextStyle,
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    ...commonTextStyle,
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  datePickerTitle: {
    ...commonTextStyle,
    fontSize: RFValue(18),
    fontWeight: 'bold',
    marginBottom: 10,
  },
  datePickerLabel: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    fontWeight: '600',
    marginVertical: 6,
    alignSelf: 'flex-start',
  },
  pickerItem: {
    ...commonTextStyle,
    backgroundColor: '#eee',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 6,
  },
  pickerItemActive: {
    ...commonTextStyle,
    backgroundColor: '#3b82f6',
  },
  resetButton: {
    ...commonTextStyle,
    backgroundColor: 'red',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  resetButtonText: {
    ...commonTextStyle,
    color: '#fff',
    fontWeight: 'bold',
  },
  confirmButton: {
    ...commonTextStyle,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  confirmButtonText: {
    ...commonTextStyle,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionContainer: {
    ...commonTextStyle,
    backgroundColor: '#fff',
  },



  flatlist: {
    ...commonTextStyle,
    height: verticalScale(80),
    width: wp('%'),
  },
  term_of_name: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: 'bold',
    marginBottom: moderateScale(10),
    color: '#0D326F',
  },
});

export const modalStyles = StyleSheet.create({
  centeredView: {
    ...commonTextStyle,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    ...commonTextStyle,
    margin: moderateScale(20),
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(12),
    padding: moderateScale(25),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
  },
  modalTitle: {
    ...commonTextStyle,
    fontSize: RFValue(20),
    fontWeight: '700',
    color: '#0D326F',
    marginBottom: moderateScale(15),
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    paddingBottom: moderateScale(10),
    width: '100%',
    textAlign: 'center',
  },
  modalText: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    marginBottom: moderateScale(10),
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: moderateScale(22),
  },
  closeButton: {
    ...commonTextStyle,
    backgroundColor: '#0D326F',
    borderRadius: moderateScale(25),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(30),
    elevation: 2,
    marginTop: moderateScale(20),
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
    color: '#ffffff',
    fontWeight: '700',
    fontSize: RFValue(16),
    textAlign: 'center',
  },
});

export const orderStatusStyles = StyleSheet.create({
  dateHeader: {
    ...commonTextStyle,
    fontSize: RFValue(18),
    fontWeight: 'bold',
    marginBottom: moderateScale(8),
    color: '#333',
    paddingLeft: moderateScale(4),
  },
  extraCountText: {
    ...commonTextStyle,
    color: '#0D326F',
    fontWeight: 'bold',
    marginBottom: moderateScale(4),
  },
  productName: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: '600',
    marginBottom: moderateScale(4),
  },
  quantity: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    color: '#555',
    marginBottom: moderateScale(6),
  },
  actionButton: {
    ...commonTextStyle,
    backgroundColor: 'white',
    borderColor: '#0D326F',
    borderWidth: 2,
    borderRadius: 6,
    width: wp(20),
    height: hp(5),
    marginLeft: moderateScale(10),
    justifyContent: 'center',  // // 수직 중앙 정렬 (flexDirection: 'column'인 경우)
    alignItems: 'center',
  },
  actionButtonText: {
    ...commonTextStyle,
    color: '#0D326F',
    fontSize: RFValue(14),
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  flatlist: {
    ...commonTextStyle,
    height: hp(80),
  }
});

export const receiptStyles = StyleSheet.create({
  receiptContainer: {
    ...commonTextStyle,
    width: '100%',
    padding: moderateScale(20),
    backgroundColor: '#fff',
  },
  header: {
    ...commonTextStyle,
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  headerTitle: {
    ...commonTextStyle,
    fontSize: RFValue(20),
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    color: '#666',
    marginTop: moderateScale(2),
  },
  divider: {
    ...commonTextStyle,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginVertical: moderateScale(8),
  },
  itemRow: {
    ...commonTextStyle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(6),
  },
  itemRowLeft: {
    ...commonTextStyle,
    flexDirection: 'column',
  },
  itemRowRight: {
    ...commonTextStyle,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  itemName: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: '600',
  },
  itemQty: {
    ...commonTextStyle,
    fontSize: RFValue(14),
    color: '#666',
    marginTop: moderateScale(2),
  },
  itemPrice: {
    ...commonTextStyle,
    fontSize: RFValue(16),
    fontWeight: '600',
    color: '#0D326F',
  },
  footer: {
    ...commonTextStyle,
    marginTop: moderateScale(10),
    alignItems: 'flex-end',
  },
  footerText: {
    ...commonTextStyle,
    color: '#1e7e34',
    fontSize: RFValue(16),
    fontWeight: 'bold',
  },
});

export const modernStyles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    // paddingVertical: moderateScale(6),
    borderBottomWidth: 2,
    // borderTopWidth: 2,
    borderBottomColor: 'rgba(139, 0, 0, 0.1)',
    // borderTopColor: 'rgba(139, 0, 0, 0.1)',
    width: '100%',
    paddingRight: moderateScale(8), // 오른쪽 패딩 줄임
  },
  storeNameText: {
    fontSize: RFValue(18),
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: moderateScale(15),
    ...commonTextStyle
  },
  settingsButton: {
    padding: moderateScale(8),
    borderRadius: 8,
    marginLeft: 'auto',
    alignSelf: 'flex-end',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    // paddingVertical: moderateScale(10),
    paddingTop: moderateScale(2),
    borderTopWidth: 2,
    borderTopColor: 'rgba(139, 0, 0, 0.1)',
  },
  navButton: {
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    paddingBottom: moderateScale(0),
    borderRadius: moderateScale(12),
  },
  activeNavButton: {
    backgroundColor: 'rgba(139, 0, 0, 0.08)',
  },
  navText: {
    color: '#64748b',
    fontSize: RFValue(12),
    marginTop: moderateScale(2),
    marginBottom: moderateScale(6),
    ...commonTextStyle
  },
  activeNavText: {
    color: '#8B0000',
    fontWeight: '600',
    fontSize: RFValue(12),
    marginTop: moderateScale(2),
    ...commonTextStyle
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(16),
    paddingBottom: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: RFValue(18),
    fontWeight: '600',
    color: '#0f172a',
    ...commonTextStyle
  },
  closeButton: {
    padding: moderateScale(4),
    borderRadius: moderateScale(8),
    backgroundColor: '#f1f5f9',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalOptionText: {
    fontSize: RFValue(16),
    color: '#334155',
    marginLeft: moderateScale(12),
    ...commonTextStyle
  },
  confirmContainer: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: RFValue(18),
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: moderateScale(8),
    textAlign: 'center',
    ...commonTextStyle
  },
  confirmMessage: {
    fontSize: RFValue(16),
    color: '#475569',
    marginBottom: moderateScale(24),
    textAlign: 'center',
    ...commonTextStyle
  },
  confirmButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: moderateScale(12),
    marginRight: moderateScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: RFValue(16),
    fontWeight: '500',
    ...commonTextStyle
  },
  logoutButton: {
    flex: 1,
    paddingVertical: moderateScale(12),
    marginLeft: moderateScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#8B0000',
    fontSize: RFValue(16),
    fontWeight: '600',
    ...commonTextStyle
  },
});
