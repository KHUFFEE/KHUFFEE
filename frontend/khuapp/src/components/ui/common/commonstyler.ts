// 수정해야함
import { TextInput, StyleSheet, Dimensions } from 'react-native';
const { height } = Dimensions.get('window');


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
    color: '#3C2415',
  },
  form_Container: {
    width: '100%',
    paddingHorizontal: 20,
    backgroundColor: ''   //여기 바꾸면 부모 컨테이너 바뀜 
  },

  // 개별 TextInput을 감싸는 컨테이너
  textboxContainer: {
    // 화면 높이의 35%를 상단 여백으로 사용 (필요에 따라 조정 가능)
    marginTop: height * 0.00005,
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



  //하단 바 관련
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


  //로그아웃 모달 관련
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
  },   // 추











































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
    backgroundColor: '#3b82f6',
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
    // position: 'relative',// 모달 안에서 드롭다운이 absolute로 펼쳐질 수 있도록
    // zIndex: 1,
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
    // 부모도 zIndex를 기본으로 준다
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
    // 기본 zIndex
    zIndex: 10,
    elevation: 10,
  },
  // ★ 열렸을 때 최상단으로 올리는 스타일
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
    backgroundColor: '#3b82f6',
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
    backgroundColor: '#3b82f6',
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
});

export const orderStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  categorySection: {
    paddingVertical: 16,
  },
  categoryList: {
    paddingHorizontal: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  productsSection: {
    paddingVertical: 16,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 5,
    justifyContent: 'space-between',
  },
  selectedItemsSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  selectedItemCard: {
    width: '48%',
    minHeight: 120,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  selectedItemInfo: {
    marginBottom: 8,
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  unitText: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
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
  removeButton: {
    width: 28,
    height: 28,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginTop: 4,
  },
  orderButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  orderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerButton: {
    backgroundColor: '#3b82f6',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  confirmationItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: '#aaa',
    marginTop: 10,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
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
    backgroundColor: '#3b82f6',
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
    color: '#3b82f6',
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
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  actionButtonText: {
    color: '#fff',
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
    color: '#3b82f6',
  },
  footer: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
