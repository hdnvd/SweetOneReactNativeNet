// @flow
import {AsyncStorage} from "react-native";
import {Common} from "sweet-js-common";
import SweetAlert from "sweet-react-native-alert";
import axios from 'axios';
import NetInfo from "@react-native-community/netinfo";
import axiosRetry from 'axios-retry';
import {ReactAppConfig,SweetConsole} from 'sweet-react-common';


class SweetFetcher {
    static METHOD_GET='get';
    static METHOD_POST='post';
    static METHOD_PUT='put';
    static METHOD_DELETE='delete';
    MaxRetriesOnErrorCount=1;
    _Fetch(URL,InitialMethod,PostingData,AfterFetchFunction,OnErrorFunction,ServiceName,ActionName,navigation,SessionKey,retries){
        // NetInfo.fetch().then(state => {
        //     SweetConsole.log(state)
        // });
        let Method=InitialMethod;
        let sendErrorReport=(URL,Method,PostingData,data,error,SessionKey)=>{
            this._sendErrorReport(URL,Method,PostingData,data,error,SessionKey);
        };
        let retryRequestIfNeeded=()=>{
            if(retries<this.MaxRetriesOnErrorCount){
                    this._Fetch(URL,InitialMethod,PostingData,AfterFetchFunction,OnErrorFunction,ServiceName,ActionName,navigation,SessionKey,retries+1);
                    return true;
            }
            return false;
        };
        let runAfterFetchFunction=(data)=>{
            try{
                AfterFetchFunction(data);
            }
            catch (error) {
                if(ReactAppConfig.getDebugging())
                    console.log(error);
                sendErrorReport(URL,InitialMethod,PostingData,data,error,SessionKey);
                if (OnErrorFunction != null)
                    OnErrorFunction(null);
            }
        };

        let theBaseURL = ReactAppConfig.getSiteUrl() + "/api";
        SweetConsole.log("Loading URL:" + theBaseURL + URL);
        SweetConsole.log("Session Key: " + SessionKey);
        NetInfo.fetch().then(state => {
            if ( state.isInternetReachable ) {

                // Run your API call
                // alert("net available");
                // this._isNetAvailable(ReactAppConfig.getSiteUrl()).then(response=>{
                //     SweetConsole.log(response);
                //     alert("after net available");
                Method = Method.toString().trim().toLowerCase();
                let PostData = null;
                if (PostingData != null) {
                    if (ReactAppConfig.getServerType() === ReactAppConfig.SERVERMODE_LARAVEL) {
                        if (Method === "put") {
                            PostingData.append('_method', 'put');
                            Method = SweetFetcher.METHOD_POST;
                        }
                        PostData = PostingData;
                    }
                    else if (ReactAppConfig.getServerType() === ReactAppConfig.SERVERMODE_ASP) {
                        PostData = new URLSearchParams(PostingData);
                    }
                }
                // alert("43");
                let Fetched = null;
                let Prefix = '';
                if (ReactAppConfig.getServerType() === ReactAppConfig.SERVERMODE_LARAVEL)
                    Prefix = 'Bearer ';
                axiosRetry(axios, { retries: 3 });
                let ax = axios.create({
                    baseURL: theBaseURL,
                    headers: {
                        Accept: 'application/json',
                        Authorization: Prefix + SessionKey,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    mode: 'cors',
                    crossDomain: true,
                });
                    // alert("58");
                if (Method === SweetFetcher.METHOD_GET) {
                    Fetched = ax.get(URL);
                }
                else if (Method === SweetFetcher.METHOD_POST) {
                    Fetched = ax.post(URL, PostData);
                }
                else if (Method === SweetFetcher.METHOD_PUT) {
                    Fetched = ax.put(URL, PostData);
                }
                else if (Method === SweetFetcher.METHOD_DELETE) {
                    Fetched = ax.delete(URL);
                }
                    // alert("71");
                Fetched.then(response => {
                    try {
                        SweetConsole.log(response,"RESPONSE OF URL:"+URL);
                    } catch (e) {

                    }

                    // alert("78");
                    let data = response.data;
                    if (data != null) {
                        SweetConsole.log(data,"RESPONSE DATA OF URL:"+URL);
                        if (Array.isArray(data.Data)) {
                            for (let i = 0; i < data.Data.length; i++) {
                                data.Data[i] = Common.convertObjectPropertiesToLowerCase(data.Data[i]);
                            }
                        }
                        else if (data.Data != null) {
                            data.Data = Common.convertObjectPropertiesToLowerCase(data.Data);
                        }
                        // alert("91");
                        runAfterFetchFunction(data);
                    }

                }).catch(function (error) {
                    // alert("96");
                    if (OnErrorFunction != null)
                        OnErrorFunction(error);
                    if (error.response != null) {
                        // alert("102");
                        // alert(error.response.status);
                        if (error.response.status !== 200 && error.response.status !== 201 && error.response.status !== 202 && error.response.status !== 203) {

                            let status = error.response.status;
                            SweetConsole.log(status.toString().trim());
                            if (status.toString().trim() === "403"){

                                if (OnErrorFunction != null)
                                    OnErrorFunction(null);
                                SweetAlert.displaySimpleAlert("خطای عدم دسترسی", 'شما دسترسی کافی برای انجام این درخواست را ندارید');
                            }
                            if (status.toString().trim() === "401")
                            {

                                if (OnErrorFunction != null)
                                    OnErrorFunction(null);
                                SweetAlert.displaySimpleAlert("خطای اطلاعات کاربری", 'اطلاعات کاربری صحیح نمی باشد');
                            }
                            else if (status.toString().trim() === "422")
                            {
                                if (OnErrorFunction != null)
                                    OnErrorFunction(null);
                                let displayDefaultMessage=true;
                                if(error.response.hasOwnProperty('data')) {
                                    let data = error.response.data;
                                    if(data.hasOwnProperty('errors') && data.errors!=null)
                                    {
                                        displayDefaultMessage=false;
                                        let message='';
                                        SweetConsole.log(data.errors);
                                        Object.keys(data.errors).forEach(function(key, index) {
                                            let item=data.errors[key];
                                            Object.keys(item).forEach(function(key, index) {
                                                let itemMessage=item[key];
                                                message=message+"\r\n"+itemMessage;
                                            });
                                        });
                                        SweetAlert.displaySimpleAlert("خطای اطلاعات ورودی",message);

                                    }
                                    else if (data.hasOwnProperty('message'))
                                    {
                                        displayDefaultMessage=false;
                                        if(data.message!=='')
                                            SweetAlert.displaySimpleAlert("خطای اطلاعات ورودی",data.message);

                                    }
                                }
                                if(displayDefaultMessage)
                                    SweetAlert.displaySimpleAlert("خطای اطلاعات ورودی", 'لطفا اطلاعات را به صورت صحیح وارد کنید');

                            }
                            else if (status.toString().trim() === "500")
                            {
                                if (OnErrorFunction != null)
                                    OnErrorFunction(null);
                                let displayDefaultMessage=true;
                                let data = error.response.data;
                                if (ReactAppConfig.getDebugging() && data.hasOwnProperty('message'))
                                {
                                    displayDefaultMessage=false;
                                    if(data.message!=='')
                                        SweetAlert.displaySimpleAlert("خطای سرور",data.message);
                                }
                                if(ReactAppConfig.getDebugging() && displayDefaultMessage)
                                    SweetAlert.displaySimpleAlert("خطای سرور", 'خطایی در سمت سرور رخ داد، لطفا این مشکل را به پشتیبانی اطلاع دهید.');
                            }


                            else if (status.toString().trim() === "400")
                            {
                                if(!retryRequestIfNeeded()){

                                    if (OnErrorFunction != null)
                                        OnErrorFunction(null);
                                    SweetAlert.displaySimpleAlert("خطای موقتی سرور", 'لطفا دوباره تلاش کنید.');
                                }

                            }
                            else if (status.toString().trim() === "405")
                            {
                                if (OnErrorFunction != null)
                                    OnErrorFunction(null);
                                SweetAlert.displayAccessDeniedAlert();

                            }
                            if (status.toString().trim() === "429")
                            {
                                if (OnErrorFunction != null)
                                    OnErrorFunction(null);
                                SweetAlert.displaySimpleAlert("خطای محافظت امنیتی", 'تعداد درخواست های شما بیش از حد مجاز است و به دلایل امنیتی دسترسی شما تا چند دقیقه بعد مسدود شد. لطفا چند دقیقه دیگر مراجعه نمایید');


                            }
                        }
                    }
                    else {

                        if(!retryRequestIfNeeded()){

                            if (OnErrorFunction != null)
                                OnErrorFunction(null);
                            console.log(error);

                            sendErrorReport(URL,InitialMethod,PostingData,{},error,SessionKey);
                            if(ReactAppConfig.getDebugging()) {
                                if (error.toString().toLowerCase().includes("network error")) {
                                    SweetAlert.displaySimpleAlert('خطا', 'متاسفانه مشکلی در اتصال به سرور به وجود آمد، لطفا درخواست خود را دوباره تکرار کنید');

                                } else {
                                    SweetAlert.displaySimpleAlert('خطا', error.toString());

                                }
                            }
                            else{
                                if (error.toString().toLowerCase().includes("network error")) {
                                    SweetAlert.displaySimpleAlert('خطا', 'متاسفانه مشکلی در اتصال به سرور به وجود آمد. در صورت تکرار این مشکل و اطمینان از اتصال اینترنت خود، لطفا نرم افزار را بسته و دوباره اجرا کنید');
                                } else {
                                    SweetAlert.displaySimpleAlert("خطا", 'با عرض پوزش، خطایی در اجرای درخواست شما به وجود آمد. لطفا چند دقیقه دیگر مراجعه نمایید و در صورت عدم حل مشکل با ما در تماس باشید. ');
                                }
                            }

                            }
                        }

                    SweetConsole.log(error.response,'Error Response');
                    SweetConsole.log(error,'Error');
                });
            }
            else
            {
                if(!retryRequestIfNeeded()){
                    if (OnErrorFunction != null)
                        OnErrorFunction(null);
                    SweetAlert.displaySimpleAlert("خطا", 'اتصال به اینترنت برقرار نیست. برای اجرای صیحی نرم افزار لطفا به اینترنت متصل شوید.');
                }

            }
        });
    }
    _sendErrorReport(URL,Method,PostingData,ReceivedData,error,SessionKey)
    {
        try{
            NetInfo.fetch().then(state => {
                try{

                    if (state.isInternetReachable) {

                        const theBaseURL = ReactAppConfig.getSiteUrl() + "/api";
                        const url='/appman/apperror';
                        const data=new FormData();
                        data.append('type','after-fetch');
                        data.append('url',URL);
                        data.append('method',Method);
                        data.append('postingdata',JSON.stringify(PostingData));
                        data.append('receiveddata',JSON.stringify(ReceivedData));
                        data.append('error',error.toString());
                        // data.append('error-stack',JSON.stringify(error.stack));
                        data.append('appname',ReactAppConfig.getAppName());
                        let Prefix = '';
                        if (ReactAppConfig.getServerType() === ReactAppConfig.SERVERMODE_LARAVEL)
                            Prefix = 'Bearer ';
                        let ax = axios.create({
                            baseURL: theBaseURL,
                            headers: {
                                Accept: 'application/json',
                                Authorization: Prefix + SessionKey,
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            mode: 'cors',
                            crossDomain: true,
                        });
                        if(ReactAppConfig.getDebugging()){
                            console.log(JSON.stringify(error));
                            // console.log(JSON.stringify(error.stack));
                            console.log(error.toString());
                            console.log('error report sending');
                        }
                        ax.post(url, data).then(response=>{
                            if(ReactAppConfig.getDebugging()){
                                console.log('error report sent');
                                console.log(response);
                            }
                        });
                    }
                }catch (e) {
                    if(ReactAppConfig.getDebugging()){
                        console.log('error sending report');
                        console.log(e);
                    }
                }
            });
        }
        catch (e) {

        }
    }
    Fetch(URL,Method,PostingData,AfterFetchFunction,OnErrorFunction,ServiceName,ActionName,navigation){

        AsyncStorage.getItem('sessionkey').then((SessionKey)=> {
            this._Fetch(URL,Method,PostingData,AfterFetchFunction,OnErrorFunction,ServiceName,ActionName,navigation,SessionKey);
            // alert("227");
        }).catch(E=>{
            // alert("229");
            this._Fetch(URL,Method,PostingData,AfterFetchFunction,OnErrorFunction,ServiceName,ActionName,history,'')

        });
    }
    _isNetAvailable = (URLToCheck) => {
        const timeout = new Promise((resolve, reject) => {
            setTimeout(reject, 10000, 'Request timed out');
        });
        const request = fetch(URLToCheck);

        return Promise
            .race([timeout, request]);
    }
}
export default SweetFetcher;
