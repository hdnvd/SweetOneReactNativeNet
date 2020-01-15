// @flow
import {AsyncStorage} from "react-native";
import {ReactAppConfig} from 'sweet-react-common';

class AccessManager{
    static LIST='list';
    static VIEW='view';
    static EDIT='edit';
    static INSERT='insert';
    static DELETE='delete';
    static UserCan(ModuleName,TableName,Action)
    {
        if(ReactAppConfig.getServerType()===ReactAppConfig.SERVERMODE_LARAVEL) {

            ModuleName=ModuleName.toLowerCase();
            TableName=TableName.toLowerCase();
            Action=Action.toLowerCase();
            let ActionString=ModuleName+'.'+TableName + "."+Action;
            let access=AsyncStorage.getItem('access.'+ActionString);
            console.log('Checking Access List '+ActionString);
            return access!=null;
        }
        else
        {
            if(Action===AccessManager.LIST)
                Action=AccessManager.VIEW;
            let access=AsyncStorage.getItem('access');
            console.log(access);
            let ActionString=TableName + "."+Action;
            let hasAccess=(access.hasOwnProperty(ActionString) && access[ActionString].toString()==="1");
            return hasAccess;
        }

    }
    static getUserRoles()
    {

        let roles= AsyncStorage.getItem('userroles');
        return roles==null?[]:roles;
    }
    static UserIsLoggedIn()
    {

        let sessionKey= AsyncStorage.getItem('sessionkey');
        if(sessionKey==null || sessionKey=="")
            return false;
        return true;
    }
    static getUserDisplayName()
    {

        let userdisplayname= AsyncStorage.getItem('userdisplayname');
        if(userdisplayname==null)
            userdisplayname="کاربر مهمان";
        return userdisplayname;
    }
    static getUserLoginTime()
    {

        let userlogintime= AsyncStorage.getItem('userlogintime');
        if(userlogintime==null)
            userlogintime="";
        return userlogintime;
    }
}

export default AccessManager;
