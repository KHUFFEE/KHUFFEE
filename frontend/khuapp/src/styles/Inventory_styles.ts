import { StyleSheet, Dimensions } from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { RFValue } from 'react-native-responsive-fontsize';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { height: screenHeight } = Dimensions.get('window');

const commonTextStyle = {
  fontFamily: 'Pretendard-Regular',
};



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
      borderRadius: moderateScale(12),
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateScale(12),
      marginBottom: moderateScale(10),
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
      width: '60%',
      fontSize: RFValue(15),
      fontWeight: '700',
      color: '#0D326F',
      textAlign: 'left',
    },
    inventory_unit_headerText: {
      ...commonTextStyle,
      width: '25%',
      fontSize: RFValue(15),
      fontWeight: '700',
      color: '#0D326F',
      textAlign: 'right',
    },
    itemContainer: {
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
    name_itemText: {
      ...commonTextStyle,
      width: '60%',
      fontSize: RFValue(15),
      fontWeight: '600',
      color: '#1e293b',
      letterSpacing: -0.3,
    },
    unit_itemText: {
      ...commonTextStyle,
      width: '25%',
      fontSize: RFValue(15),
      fontWeight: '600',
      color: '#0D326F',
      textAlign: 'right',
    },
    inventory_selectItemRowContainer: {
      ...commonTextStyle,
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: moderateScale(6),
      paddingLeft: moderateScale(2),
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