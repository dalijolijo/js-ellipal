// 		(c)2018 Ellipal Limited
//		Web App demo & JavaScript Lib

(function(window){

    if(!String.prototype.format){
        String.prototype.format = function(){
            var args = arguments;
            return this.replace(/{(\d+)}/g, function(match, num){
                return typeof args[num] !== "undefined" ? args[num] : match;
            });
        };
    }
    if(!String.prototype.trim){
        String.prototype.trim = function(){
            return String.prototype.replace.call(this,/^\s+|\s+$/g,'');
        };
    }

    window.ellipal = {
        _v: "1.7.4",
        apiKey: undefined,
        apiUrl: "https://wallet.ellipal.com/api{0}?gApikey={1}&gPlatform=Web",
        setApiKey: function(key){
            this.apiKey = key;
        },
        getApiKey: function(){
            return this.apiKey;
        },
        getApiVersion: function(){
            return this._v;
        },
        connectWallet: function(syncUrl){
            var ret = undefined;
            if(!syncUrl || !syncUrl.trim().split("//sync/")[1] || !syncUrl.trim().split("//sync/")[1].split("/")){
                ret = false;
                console.warn("[Ellipal] connectWallet Parameter error");
                return ret;
            }
            var items = syncUrl.trim().split("//sync/")[1].split("/");
            if (items.length > 0) {
                ret = {};
                    ret["name"]   = items[0];
                    ret["type"]   = items[1];
                    ret["addr"]    = items[2];
                    if(items.length > 3){
                        ret["pubkey"] = items[3];
                    }
                    if(items.length > 4){
                        ret["legacyAddr"] = items[4];
                    }
            }
            return ret;
        },
        getSignedTx: function(signUrl) {
            var ret = undefined;
            if(!signUrl || !signUrl.trim().split("//")[1] || !signUrl.trim().split("//")[1].split("/")){
                ret = false;
                console.warn("[Ellipal] prepareTx Parameter error");
                return ret;
            }
            var items = signUrl.trim().split("//")[1].split("/");
            if (items.length > 0) {
                ret = {};
                if(items[0].indexOf("@") > -1){
                    ret["curr"]   = items[0].split("@")[0].split(":")[0];
                    ret["total"]  = items[0].split("@")[0].split(":")[1];
                }
                ret["type"]   = items[1];
                ret["addr"]   = items[2];
                ret["signedData"]     = items[3];
            }
            return ret;
        },
	    getBalance: function(apiKey, cType, addr) {
            var self = this;
            var ret = false;
            var apiKey = apiKey || this.apiKey;
            if(!apiKey || !cType || !addr){
                console.error("[Ellipal] getBalance Parameter error");
                return;
            }
            var parmObj = {
                cType: cType,
                walletAddress: addr
            };
            $.ajax({
                type: 'POST',
                async: false,
                url: self.apiUrl.format("/getBalance", apiKey),
                data: parmObj,
                dataType: 'json',
                success: function(data, status, xhr){
                    //todo
                    ret = _conform._conformBalance(data);
                },
                error: function(xhr, type){
                    console.error("[Ellipal] getBalance xhr error");
                }
            })
            return ret;
        },
        getAverageMinerFee: function(apiKey, cType){
            var self = this;
            var ret = false;
            var apiKey = apiKey || this.apiKey;
            if(!apiKey || !cType){
                console.error("[Ellipal] getAverageMinerFee Parameter error");
                return;
            }
            $.ajax({
                type: 'POST',
                async: false,
                url: self.apiUrl.format("/getAgency", apiKey),
                data: {cType : cType},
                dataType: 'json',
                success: function(data, status, xhr){
                    //todo
                    ret = _conform._conformAverageMinerFee(data);
                },
                error: function(xhr, type){
                    console.error("[Ellipal] getAverageMinerFee xhr error");
                }
            })
            return ret;
        },
        prepareTx: function(apiKey, paramObj){
            var self = this;
            var ret = false, transferUrl;
            apiKey = apiKey || this.apiKey;
            if(!apiKey || !paramObj){
                console.error("[Ellipal] prepareTx Parameter error");
                return;
            }
            $.ajax({
                type: 'POST',
                async: false,
                url: self.apiUrl.format("/transaction", apiKey),
                data: paramObj,
                dataType: 'json',
                success: function(data, status, xhr){
                    //todo
                    ret = _conform._conformPrepareTx(data);
                },
                error: function(xhr, type){
                    console.error("[Ellipal] prepareTx xhr error!!")
                }
            })
            return ret;
        }, 
        broadcastTx: function(apiKey, paramObj){
            var self = this;
            var ret = false, transferUrl;
            apiKey = apiKey || this.apiKey;
            if(!apiKey || !paramObj){
                console.error("[Ellipal] broadcastTx Parameter error");
                return;
            }
            $.ajax({
                type: 'POST',
                async: false,
                url: self.apiUrl.format("/transaction", apiKey),
                data: paramObj,
                dataType: 'json',
                success: function(data, status, xhr){
                    //todo
                    ret = _conform._conformBroadcastTx(data);
                },
                error: function(xhr, type){
                    console.error("[Ellipal] broadcastTx xhr error!!")
                }
            })
            return ret;
        }
    }

    var _conform = {
        _conformBalance: function(data){
            var ret = {};
            ret["status"]= data.status;
            if(data.msg){ret["msg"]= data.msg;}
            if(data.code){ret["code"]= data.code;}
            if(data.status && data.data.list){
                var dataList = [];
                var list = data.data.list; 
                for(var i = 0; i < list.length; i++){
                    var obj = {};
                    obj["address"]      = list[i].address;
                    obj["contractAddr"] = list[i].contractAddr;
                    obj["cType"]        = list[i].cType;
                    obj["balance"]      = list[i].balance;
                    obj["decimal"]      = list[i].gwei;
                    obj["logo"]         = list[i].logo;
                    obj["symbol"]         = list[i].shortName;
                    obj["usdValue"]     = list[i].usdValue;
                    dataList.push(obj);
                }
                ret["data"]              = {};
                ret["data"]["balanceTotalUSD"] = data.data.balanceTotalUSD;
                ret["data"]["dataList"]  = dataList;
            }
            return ret;
        },
        _conformAverageMinerFee: function(data){
            var ret = {};
            ret["status"]          = data.status;
            if(data.msg){ret["msg"]= data.msg;}
            if(data.code){ret["code"]= data.code;}
            if(data.status && data.data){
                ret["data"]            = {};
                ret["data"]["gasMul"]  = data.data.gasMul;
                ret["data"]["gasPrice"]= data.data.gasPrice;
                ret["data"]["decimal"] = data.data.gwei;
                ret["data"]["gasUnit"] = data.data.gasUnit;
            }
            return ret;
        },
        _conformPrepareTx: function(data){
            var ret = {};
            ret["status"] = data.status;
            if(data.msg){ret["msg"]= data.msg;}
            if(data.code){ret["code"]= data.code;}
            if(data.status && data.data){
                ret["data"]             = {};
                ret["data"]["txDigest"] = data.data.txDigest;
                ret["data"]["tx"]       = data.data.tx;
            }
            return ret;
        },
        _conformBroadcastTx: function(data){
            var ret = {};
            ret["status"] = data.status;
            if(data.msg){ret["msg"]= data.msg;}
            if(data.code){ret["code"]= data.code;}
            return ret;
        }
    }

})(window);
