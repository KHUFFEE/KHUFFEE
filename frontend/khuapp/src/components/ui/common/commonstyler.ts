// 수정해야함
import { Platform,TextInput, StyleSheet, Dimensions } from 'react-native';
const { height: screenHeight } = Dimensions.get('window');
import { scale,verticalScale,moderateScale } from 'react-native-size-matters';
/** 스타일들 */
export const styles = StyleSheet.create({

  // login.tsx 밑 공통 compon
  dashboardContainer: {     // login.tsx, main.tsx , StoreEmployeeDashboard 사용 
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    flex: 1,
  },
  contentContainer: {      //login.tsx 사용 
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {       //login.tsx 로고 
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {             //login.tsx 로고 이미지 크기 설정
    width: 100,
    height: 100,
    alignSelf: 'center',
    right: 10,
    marginBottom: -5,
  },
  logo_name: {            //logo 아래 이름
    fontSize: 27,
    fontWeight: 700,
    marginBottom: -10,
    textAlign: 'center',
    color: '#8B0000',
  },
  form_Container: {
    width: '100%',
    paddingHorizontal: 20,
    backgroundColor: ''   //여기 바꾸면 부모 컨테이너 바뀜 
  },

  // 개별 TextInput을 감싸는 컨테이너
  textboxContainer: {
    // 화면 높이의 35%를 상단 여백으로 사용 (필요에 따라 조정 가능)
    marginTop: screenHeight * 0.00005,
    opacity: 1,
  },
  form_input_box: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#B5B5B5', // 원하는 테두리 색으로 변경
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 5,
    backgroundColor: '#FFFFFF', // 내부 채우기를 흰색으로 설정
  },
  login_errorText: {  // loginScreen.tsx에서 사용
    color: '#A40F16',
    fontWeight: 600,
    marginBottom: 0,
    textAlign: 'center',
  },
  login_button: {   //gd
    width: '100%', // 버튼의 너비를 화면의 100%로 설정합니다.
    height: 50,   //버튼의 높이를 50 픽셀로 설정합니다.
    backgroundColor: '#0D326F',  // 버튼의 배경색을 지정합니다.
    borderRadius: 8,   // 버튼의 모서리를 둥글게 만들어 8 픽셀의 반경을 적용합니다.
    justifyContent: 'center',  // // 수직 중앙 정렬 (flexDirection: 'column'인 경우)
    alignItems: 'center', // 수평 중앙 정렬
    marginTop: 5,  // 버튼 위쪽에 10 픽셀의 여백을 추가합니다.
    // iOS용 그림자 설정
    shadowColor: '#000',            // 그림자의 색상을 검정색으로 설정합니다.
    shadowOffset: { width: 0, height: 2 },  // 그림자의 위치를 버튼 아래쪽으로 2 픽셀 이동시킵니다.
    shadowOpacity: 0.15,            // 그림자의 투명도를 25%로 설정합니다.
    shadowRadius: 3.84,             // 그림자의 블러(퍼짐) 정도를 3.84로 설정합니다.
    
    // Android용 그림자 설정
    elevation: 5,                   // Android에서 그림자 효과를 주기 위해 5의 elevation 값을 설정합니다.
  },

  login_buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },



  //main.tsx 시작 
  //상단 바 관련
  head_Container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 2.5,
    borderBottomColor: '#8B0000',
  },
  head_storeNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  bottom_navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderTopWidth: 2.5,
    borderTopColor: '#8B0000',
  },
  bottom_navButton: {
    alignItems: 'center',
  },
  bottom_navText: {
    color: 'black',
    marginTop: 4,
  },
  bottom_activeNavText: {
    color: '#8B0000',
    fontWeight: 'bold',
    marginTop: 4,
  },
  bottom_Overlay: {
    flex: 1,
    backgroundColor: 'rgba(68, 60, 60, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottom_Container: {
    width: '80%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  bottom_modal_Option: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  bottom_modalOptionText: {
    fontSize: 18,
    color: '#333',
  },
  loading_Container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loading_Text: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: '600',
    left: 5,
    color: '#00000080',
    alignItems: 'center',
  },

  // OrderRequest.tsx 관련 스타일
  selectItemCard: {
    paddingVertical: moderateScale(12),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    // flexGrow: 1,
    alignItems: 'center',
    // justifyContent: 'space-between',
    marginBottom: moderateScale(1),
    height:'1.5%',
  },
  selectItemInfo: {
    marginBottom: 8,
  },
  selectItemName: {
    width: '60%',
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: 2,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    textAlign: 'left',
    letterSpacing: -0.5,
  },
  unitText: {
    width: '20%',
    fontSize: moderateScale(14),
    color: 'black',
    fontWeight: '500',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    paddingLeft: moderateScale(5),
  
  },
  price_unit_Text: {
    width: '20%',
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1e7e34',
    textAlign: 'center',
    letterSpacing: -0.5, // 음수 값을 주면 글자 간격이 줄어듭니다.
  },
  columnCenteredView: {
    width: '30%',
    height: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column'
  },
  actionsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: '#fff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  quantityInput: {
    width: 40,
    height: 28,
    borderColor: '#ccc',
    borderWidth: 1,
    textAlign: 'center',
    borderRadius: 4,
    marginHorizontal: 2,
    fontSize: 14,
    padding: 0,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D326F',
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginTop: 4,
  },
  orderButton: {
    width: '15%',
    minWidth: moderateScale(30),
    height: '30%',
    minHeight: verticalScale(30),
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#0D326F',
    borderWidth: 3,
    marginLeft: moderateScale(10),
  },
  orderButtonText: {
    color: '#0D326F',
    fontSize: moderateScale(15),
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  order_request_Button: {
    backgroundColor: '#0D326F',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  order_request_ButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButton: {
    width: 28,
    height: 28,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerContainer: {
    backgroundColor: '#cf8888',
    gap: moderateScale(2),
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
  },
  item_headerText: {
    width: '60%',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  unit_headerText: {
    width: '20%',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',

  },
  price_headerText: {
    width: '20%',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    
    // borderRightWidth: 1,
    // borderRightColor: '#ddd',
  },

  listContainer: {
    marginTop: 1,
    marginBottom: 0, // 수정됨: 마지막 아이템이 footer 위에 보이도록 추가
  },
  // 수정됨: scrollContainer 스타일 변경
  scrollContainer: {
    flexGrow: 1,           // height 대신 flexGrow 사용하여 내용 확장
    paddingHorizontal: 10,
    paddingBottom: 100,    // footer 높이를 고려한 여백 추가
    backgroundColor: '#fff',
  },
  fixedHeaderContainer: {
    backgroundColor: '#fff',
    paddingVertical: moderateScale(10),
    paddingRight: moderateScale(-5),
    paddingBottom: moderateScale(-5),
    zIndex: moderateScale(10),
  },
  scrollContainerWithHeader: {
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  categorySection: {
    paddingTop: 10,
  },
  categoryList: {
    paddingRight: moderateScale(100),
    paddingLeft: moderateScale(10),
    flexDirection: 'row',
  },
  categoryButton: {
    ...Platform.select({
      web: {
        alignSelf: 'flex-start',
      },
      default: {
        // 기존 flex: 1, flexBasis: 0 제거
      },
    }),
    marginHorizontal: scale(2),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(8),
    backgroundColor: 'white',
    borderColor: '#B5B5B5',
    borderWidth: scale(1),
    alignItems: 'center', // 텍스트를 수평 중앙 정렬
    justifyContent: 'center', // 텍스트를 수직 중앙 정렬
  },
  categoryButtonActive: {
    borderColor: '#0D326F',
    borderWidth: scale(2.5),
  },
  categoryButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    flexShrink: 1,
  },
  categoryButtonTextActive: {
    color: '#0D326F',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    right: 15,
    paddingHorizontal: 16,
    width: '100%',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerPriceText: {
    color: '#A40F16',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerButton: {
    backgroundColor: '#0D326F',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  footerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedItemsSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: '#aaa',
    marginTop: 10,
  },
  contentContainerStyle: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsSection: {
    paddingLeft: 8,
    marginBottom: screenHeight * 0.8,
  },
  productGrid: {
    flexDirection: 'column',
    paddingHorizontal: 5,
    justifyContent: 'space-between',
  },
  selectItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cardContent: {
    flexDirection: 'column',
    width: '100%',
  },
  selectItemRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(2),
    // justifyContent: 'space-between',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
  },

  selectItemCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: moderateScale(15),
    paddingTop: moderateScale(8),
  },

  //선택 될 때 2번째 행 정의
  selectItemCardFooter_selected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(12),
  },
  actionsContainer_selected: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },


  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between', // 필요에 따라 'flex-start' 또는 'center'로 조정 가능
    marginTop: moderateScale(8),
  },
  priceContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // 선택한 상품 확인 css 

  confirm_selectedItemsSection: {

    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  confirm_sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    width: '100%'
  },
  confirmationItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    width: `100%`,
  },
  confirm_selectItemName: {   // 상품명 셀
    flex: 3,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    width: '100%',

  },  
  confirm_unitText: {         // 출고단위 셀
    flex: 0.7,
    fontSize: 14,
    color: 'black',
    fontWeight: '500', 
 
  },
  confirm_priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D326F',
  },
  confirm_totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: '#aaa',
    marginTop: 10,
  },
  totalText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: 'bold',
  },







  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  sortButton: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodModalInner: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    overflow: 'visible',
  },
  periodModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateGroup: {
    flex: 1,
    alignItems: 'center',
    marginTop: 12,
  },
  dateGroupLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  dateBox: {
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
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownWrapper: {
    position: 'relative',
    marginHorizontal: 4,
    zIndex: 1,
  },
  dropdown: {
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
    zIndex: 9999,
    elevation: 9999,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  periodSearchButton: {
    backgroundColor: '#0D326F',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  periodSearchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadMoreButton: {
    alignSelf: 'center',
    marginVertical: 10,
    backgroundColor: '#0D326F',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  loadMoreButtonLoading: {
    backgroundColor: 'transparent',
  },
  loadMoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 6,
    alignSelf: 'flex-start',
  },
  pickerItem: {
    backgroundColor: '#eee',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 6,
  },
  pickerItemActive: {
    backgroundColor: '#3b82f6',
  },
  resetButton: {
    backgroundColor: 'red',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: '#fff',
  },

});

export const orderStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },


 
});

export const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#0D326F',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
    marginTop: 15,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export const orderStatusStyles = StyleSheet.create({
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    paddingLeft: 4,
  },
  extraCountText: {
    color: '#0D326F',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  actionButton: {
    backgroundColor: 'white',
    borderColor: "#0D326F",
    borderWidth: 2,
    borderRadius: 6,
    width:90,
    height:35,
    marginLeft: 10,
    justifyContent: 'center',  // // 수직 중앙 정렬 (flexDirection: 'column'인 경우)
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#0D326F',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export const receiptStyles = StyleSheet.create({
  receiptContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemRowLeft: {
    flexDirection: 'column',
  },
  itemRowRight: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemQty: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D326F',
  },
  footer: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  footerText: {
    color: '#1e7e34',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
