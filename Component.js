sap.ui.define([
   "sap/ui/core/UIComponent",
   "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (UIComponent, JSONModel, Device) {
   "use strict";
   return UIComponent.extend("sap.ui.veh_cotizacion.Component", {
         metadata : {
            manifest: "json",
            config: {
               fullWidth: true
            },
            includes: ["util/styleFormato.css"]
      },
      init : function () {
         // call the init function of the parent
         UIComponent.prototype.init.apply(this, arguments);
         // set data model
          
         this.getRouter().initialize();
          
          // set device model
            var oDeviceModel = new JSONModel(Device);
            oDeviceModel.setDefaultBindingMode("OneWay");
            this.setModel(oDeviceModel, "device");
            jQuery.sap.registerModulePath("appbarra", "../AppBarra");
         
         /*var oModel = new sap.ui.model.json.JSONModel();
         oModel.loadData("model/mockdata/products.json");
         this.setModel(oModel);*/

//         var url = "http://sap-fiori-t77.t77secure.biz:50000/sap/opu/odata/sap/ZLIBERA_PEDIDOS_SRV/";
//         var oModel = new sap.ui.model.odata.ODataModel(url, true, "ffarro", "inicio02");
//	     this.setModel(oModel);
          
      }
   });
});