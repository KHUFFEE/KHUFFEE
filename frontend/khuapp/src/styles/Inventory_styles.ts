import { StyleSheet, Dimensions,TextStyle } from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { RFValue } from 'react-native-responsive-fontsize';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { height: screenHeight } = Dimensions.get('window');

const commonTextStyle = (customStyle: Partial<TextStyle> = {}): TextStyle => ({
  fontFamily: 'PretendardVariable',
  fontWeight: customStyle.fontWeight ? customStyle.fontWeight : '400',
  ...customStyle,
});


export const inventoryStyles = StyleSheet.create({
    container: {
      ...commonTextStyle,
      flex: 1,
      padding: moderateScale(20),
      backgroundColor: '#fff',
    },
      term_of_name: {
        ...commonTextStyle,
        fontSize: RFValue(16),
        fontWeight: 'bold',
        marginBottom: moderateScale(10),
        color: '#0D326F',
      },
    title: {
      ...commonTextStyle,
      fontSize: RFValue(18),
      fontWeight: '700',
      color: '#0D326F',
      marginBottom: moderateScale(12),
      // paddingHorizontal: moderateScale(16),
      width: '65%',
      borderLeftWidth: 4,
      borderLeftColor: '#0D326F',
      paddingLeft: moderateScale(5),
      marginLeft: moderateScale(5)
    },
    inventory_HeaderContainer: {
      ...commonTextStyle,
      backgroundColor: '#f8f9fa',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      // borderRadius: moderateScale(12),
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateScale(12),
      // marginBottom: moderateScale(10),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    inventory_item_headerText: {
      ...commonTextStyle,
      width: '65%',
      fontSize: RFValue(15),
      fontWeight: '700',
      color: '#0A2A5E',
      textAlign: 'left',
    },
    inventory_unit_headerText: {
      ...commonTextStyle,
      width: '35%',
      fontSize: RFValue(15),
      fontWeight: '700',
      color: '#0A2A5E',
      textAlign: 'center',
      marginLeft: moderateScale(15),
    },
    itemContainer: {
      ...commonTextStyle,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: moderateScale(10),
      marginBottom: moderateScale(8),
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
    name_itemText: {
      ...commonTextStyle,
      width: '65%',
      fontSize: RFValue(15),
      fontWeight: '500',
      color: '#1e293b',
      letterSpacing: -0.3,
    },
    unit_itemText: {
      ...commonTextStyle,
      width: '20%',
      fontSize: RFValue(15),
      fontWeight: '600',
      color: '#0A2A5E',
      textAlign: 'center',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: moderateScale(8),
      paddingVertical: moderateScale(4),
      paddingHorizontal: moderateScale(6),
      backgroundColor: '#f8fafc',
    },
    inventory_selectItemRowContainer: {
      ...commonTextStyle,
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: moderateScale(6),
      paddingLeft: moderateScale(2),
      gap: moderateScale(30),
      position: 'relative',
    },
    flat_inventory: {
      ...commonTextStyle,
      flex: 1,
      marginBottom: moderateScale(10),
    },
    editButton: {
      ...commonTextStyle,
      backgroundColor: '#0D326F',
      borderRadius: 25,
      paddingVertical: moderateScale(12),
      paddingHorizontal: moderateScale(30),
      marginTop: moderateScale(10),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    editButtonText: {
      ...commonTextStyle,
      color: '#ffffff',
      fontSize: RFValue(16),
      fontWeight: 'bold',
      textAlign: 'center',
    },
    message: {
      ...commonTextStyle,
      fontSize: RFValue(16),
      color: '#555',
      textAlign: 'center',
      marginTop: 20,
    },
    status_container: {
      ...commonTextStyle,
      flex: 1,
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      backgroundColor: '#fff',
      paddingHorizontal: moderateScale(16),
    },
    inventory_cardContent: {
      ...commonTextStyle,
      flexDirection: 'column',
      width: '100%',
      // height: hp(3)
    },
  });
  export const toggleButtonStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: moderateScale(10),
    },
    button: {
      paddingVertical: moderateScale(8),
      paddingHorizontal: moderateScale(16),
      borderRadius: moderateScale(6),
      marginHorizontal: moderateScale(5),
      borderWidth: 1,
      borderColor: '#0A2A5E',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
    },
    buttonActive: {
      backgroundColor: '#0A2A5E',
    },
    buttonText: {
      fontSize: 14,
      color: '#0A2A5E',
      fontWeight: 'bold',
    },
    buttonTextActive: {
      color: '#fff',
    },
  });
  
  export const headerRowStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginVertical: moderateScale(4),
      // paddingRight: moderateScale(8),
    },
    rightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: moderateScale(10),
    },
    smallButton: {
      backgroundColor: '#0A2A5E',
      paddingVertical: moderateScale(6),
      paddingHorizontal: moderateScale(12),
      borderRadius: moderateScale(10),
      borderWidth: 1,
      borderColor: '#0A2A5E',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
      elevation: 2,
    },
    buttonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
  });
  
  export const modalStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '80%',
      backgroundColor: '#fff',
      padding: moderateScale(20),
      borderRadius: moderateScale(10),
      alignItems: 'center',
    },
    modalText: {
      marginBottom: moderateScale(20),
      fontSize: 16,
      textAlign: 'center',
    },
  });
  
  export const searchStyles = StyleSheet.create({
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: moderateScale(10),
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: moderateScale(8),
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      overflow: 'hidden',
    },
    searchInput: {
      flex: 1,
      paddingVertical: moderateScale(10),
      paddingHorizontal: moderateScale(12),
      fontSize: 14,
      color: '#1e293b',
    },
    searchIcon: {
      padding: moderateScale(10),
    },
    searchIconSize: {
      width: 20,
      height: 20,
    },
    searchIconContainer: {
      marginRight: moderateScale(8),
      borderRadius: moderateScale(20),
    },
  });
  
  export const editModeStyles = StyleSheet.create({
    controlContainer: {
      width: '20%',
      position: 'relative',
    },
    controlButtonsGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      position: 'relative',
    },
    controlButtonsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'absolute',
      right: 0,
    },
    controlButton: {
      padding: moderateScale(4),
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: moderateScale(6),
      backgroundColor: '#f8fafc',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
      width: moderateScale(26),
      height: moderateScale(26),
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      zIndex: 1,
    },
    deleteButton: {
      padding: moderateScale(6),
      borderWidth: 1,
      borderColor: '#ffcccc',
      borderRadius: moderateScale(8),
      marginLeft: moderateScale(4),
      backgroundColor: '#fff5f5',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
    },
    quantityInput: {
      width: '100%',
      textAlign: 'center',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: moderateScale(8),
      paddingVertical: moderateScale(4),
      paddingHorizontal: moderateScale(6),
      // backgroundColor: '#f8fafc',
      fontSize: RFValue(15),
      fontWeight: '600',
      // color: '#0A2A5E',
    },
    leftButton: {
      left: -30,
      top: '50%',
      transform: [{ translateY: -13 }],
    },
    rightButton: {
      right: -30,
      top: '50%',
      transform: [{ translateY: -13 }],
    },
  });