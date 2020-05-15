jQuery.sap.require("sap.ui.veh_cotizacion.util.Formatter");
jQuery.sap.require("sap/ui/model/json/JSONModel");
jQuery.sap.require("sap/m/MessageToast");
jQuery.sap.require("sap/m/Table");
// jQuery.sap.require("sap/m/semantic");

sap.ui.define([
	"sap/ui/veh_cotizacion/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/veh_cotizacion/util/Formatter",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/Label",
	"sap/m/MessageToast",
	"sap/m/Text",
	"sap/ui/layout/HorizontalLayout",
	"sap/ui/layout/VerticalLayout",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV"
	
], function (BaseController, MessageBox, JSONModel,Filter,FilterOperator,formatter, Button, Dialog, Label, MessageToast, Text, HorizontalLayout, VerticalLayout, Export, ExportTypeCSV) {
    "use strict";
    var File;
    var urlGlobal = sessionStorage.urlGlobal;
    var usuarioName = sessionStorage.usuarioName;
    var usuarioSap = sessionStorage.usuarioSap;
    var contador = 0;
    var ano_fact = [];
    var indexCont = 0;
    var click = 1;
    var clk_m = 1;
    var clk_t = 1;
    var tableuse;
    //Migración Odata
    var newUrlGlobal = "/DEV_TO_ODVIATICOS/odata/SAP/ZSCP_VEHICULOS_SRV";
    var oModel;
    return BaseController.extend("sap.ui.veh_cotizacion.controller.Home", {
    	formatter: formatter,
		onInit : function () {
            sap.ui.core.BusyIndicator.show(0);
            var filter = [];
            var filter1 = [];
            var filter2 = [];

            oModel = new sap.ui.model.odata.v2.ODataModel(newUrlGlobal, true);
			var thes = this;
			thes.getView().byId("frgReporte--tblVisualizarT").getTable().setMode("SingleSelectLeft");
            contador = 0;
            ano_fact = [];
			var myModel = this.getOwnerComponent().getModel();
			myModel.setSizeLimit(99999);
			var isMobile = sap.ui.Device.system.phone;
			if (isMobile) {
				tableuse = "frgReporte--tblVisualizarM";
				thes.getView().byId("frgReporte--tblVisualizarT").setVisible(false);
				thes.getView().byId("frgReporte--tblVisualizarM").setVisible(true);
			}else{
				tableuse = "frgReporte--tblVisualizarT";
				thes.getView().byId("frgReporte--tblVisualizarT").setVisible(true);
				thes.getView().byId("frgReporte--tblVisualizarM").setVisible(false);
				thes.getView().byId("frgReporte--botonVolver").setVisible(false);
			}
			thes.onLoadM();
			thes.onLoadT();
			//CrearCotización
            //Obtener el codigo de Concesionario
            var filterpar = new sap.ui.model.Filter("Id", sap.ui.model.FilterOperator.EQ, "03");
                filter.push(filterpar);
              
            //EntitySet es el entityset del metadata 
            oModel.read("/PRC_VEHICULOSSet" ,{
              method: "GET",
              filters: filter,
              success: function(result, status, xhr){
                sap.ui.core.BusyIndicator.hide();
                thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "txtConcesionario")).setValue(parseInt(JSON.parse(result.results[0].Json)));
              },
              error: function(xhr,status,error){
                sap.m.MessageBox.error(xhr.statusText);
                sap.ui.core.BusyIndicator.hide();
              },
              urlParameters: {
                search: "GET"
              }

            });

            //Obtener tipo de cotización
            var filterpar = new sap.ui.model.Filter("Id", sap.ui.model.FilterOperator.EQ, "02");
                filter1.push(filterpar);
              
            //EntitySet es el entityset del metadata 
            oModel.read("/PRC_VEHICULOSSet" ,{
              method: "GET",
              filters: filter1,
              success: function(result, status, xhr){
                sap.ui.core.BusyIndicator.hide();
                var tipoCoti = JSON.parse(result.results[0].Json);

                var oModel = new JSONModel({
                    "tipoCotiitems": tipoCoti
                });
                thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "selectTipoCoti")).setModel(oModel, "tipoCoti");
              },
              error: function(xhr,status,error){
                sap.m.MessageBox.error(xhr.statusText);
                sap.ui.core.BusyIndicator.hide();
              },
              urlParameters: {
                search: "GET"
              }

            });

            //Obtener periodo
            var filterpar = new sap.ui.model.Filter("Id", sap.ui.model.FilterOperator.EQ, "04");
                filter2.push(filterpar);
              
            //EntitySet es el entityset del metadata 
            oModel.read("/PRC_VEHICULOSSet" ,{
              method: "GET",
              filters: filter2,
              success: function(result, status, xhr){
                thes.parseTipoDoc(JSON.parse(result.results[0].Json));
                sap.ui.core.BusyIndicator.hide();
              },
              error: function(xhr,status,error){
                sap.m.MessageBox.error(xhr.statusText);
                sap.ui.core.BusyIndicator.hide();
              },
              urlParameters: {
                search: "GET"
              }

            });
		},
		FormatDate: function(date){
			var fec = date;
			var anio = fec.substr(0, 4);
			var mes = fec.substr(4, 2);
			var dia = fec.substr(6, 2);
			return dia + "." + mes + "." + anio;
		},
        //----------------------------CREAR COTIZACIONES
        //Parsear el listado del año de facturación
        parseTipoDoc: function(ano){
            $.each(ano, function(i, v) {
                var elemento={
                   'key':v,
                   'text':v
                };
                ano_fact.push(elemento);
            });
        },
        //Función para completar los campos en 0
		onCompleteFormat: function(txt, cant){
			var rtn = "";
			var cycles = cant - txt.length;
			for(var i = 0; i < cycles; i++){
			    rtn += "0";
			}
			return   rtn + txt;
		},
        //Agregar un material
        agregar: function(){
            contador = contador + 1;
            var thes = this;
            var filter = [];
            var table = this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "tblCotizacion"));
            var z = new sap.m.Input({visible: false, value: contador});
            var q = new sap.m.MultiInput({value: "" , valueHelpRequest: function(){thes.busqueda(z.getValue())}});
                q.onsapenter = function(e){
                    sap.ui.core.BusyIndicator.show(0);
                    var kunnr = q.getValue();
                    var newCod = thes.onCompleteFormat(kunnr, 18);
                    if(kunnr != ""){

                        var datos = [{"COD_MATERIAL": newCod, "TEXTO_BREVE": ""}];

                        var filterPara = new sap.ui.model.Filter("Parametros", sap.ui.model.FilterOperator.EQ, JSON.stringify(datos));
                            filter.push(filterPara);

                        var filterPara2 = new sap.ui.model.Filter("Id", sap.ui.model.FilterOperator.EQ, "09");
                            filter.push(filterPara2);
                          
                        //EntitySet es el entityset del metadata 
                        oModel.read("/PRC_VEHICULOSSet" ,{
                          method: "GET",
                          filters: filter,
                          success: function(result, status, xhr){
                            if(JSON.parse(result.results[0].Json)[0].type != undefined){
                                sap.m.MessageBox.warning(JSON.parse(result.results[0].Json)[0].message);
                                w.setValue("");
                                a.setValue("");
                            }else{
                                q.setValue(parseInt(JSON.parse(result.results[0].Json)[0].matnr));
                                a.setValue(JSON.parse(result.results[0].Json)[0].maktg);
                                w.setValue(JSON.parse(result.results[0].Json)[0].meins);
                            }
                            sap.ui.core.BusyIndicator.hide();
                          },
                          error: function(xhr,status,error){
                            sap.m.MessageBox.error(xhr.statusText);
                            sap.ui.core.BusyIndicator.hide();
                          },
                          urlParameters: {
                            search: "GET"
                          }

                        });
                    }else{
                        sap.ui.core.BusyIndicator.hide();
                    }
                }
            var w = new sap.m.Input({value: "", editable: false});
            var a = new sap.m.Input({value: "", editable: false});
            var r = new sap.m.Select({forceSelection:false, selectedKey:"1",
                                         items:ano_fact});
            var u = new sap.m.TextArea({value: ""});
            var t = new sap.m.Input({value: "", type: "Text", change: function(e){
                                        sap.ui.controller("sap.ui.veh_cotizacion.controller.Home").validaNumberC(this)}});
            var y = new sap.m.Input({value: "", type: "Text", change: function(e){
                                        sap.ui.controller("sap.ui.veh_cotizacion.controller.Home").validaNumberC(this)}, visible: true, textAlign: sap.ui.core.TextAlign.End, placeholder: "0.00"});
            var oTableItems = new sap.m.ColumnListItem({cells:[q,a,w,r,t,u,y,z]});
            table.addItem(oTableItems);
        },

        //Eliminar Material
        eliminarMaterial: function(){
            var thes = this;
            var iIndex = this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "tblCotizacion")).getSelectedItem();
            if (iIndex != null) {
                var oSelectedItems = this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "tblCotizacion")).getSelectedItems();

                $.each(oSelectedItems, function(index, item){
                    thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "tblCotizacion")).removeItem(item);
                });
                var Materiales = this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "tblCotizacion")).getItems();

                contador = 0;
                $.each(Materiales, function(key, item){
                    var oCells = item.mAggregations.cells;
                    contador +=1;
                    sap.ui.getCore().byId(oCells[6].sId).setValue(contador);
                });
            }else{
                var dialog = new Dialog({
                    title: 'Aviso',
                    type: 'Message',
                    state: 'Warning',
                    content: new Text({
                        text: 'Debe seleccionar un registro.'
                    }),
                    beginButton: new Button({
                        text: 'OK',
                        press: function () {
                            dialog.close();
                        }
                    }),
                    afterClose: function() {
                        dialog.destroy();
                    }
                });

                dialog.open();
            }
        },

        //Vista de búsqueda de los materiales en general por codigo material y descripción.
        busqueda: function(z){
            indexCont = z;
            this._oDialog = sap.ui.xmlfragment("busquedaMaterial", "sap.ui.veh_cotizacion.fragment.BuscarMaterial", this);
            this._oDialog.open();
            var thes = this;
            sap.ui.getCore().byId("busquedaMaterial--inCodMaterial").onsapenter = function(e) {  
                thes.buscarPersona(); 
            };

            sap.ui.getCore().byId("busquedaMaterial--inTextoBreve").onsapenter = function(e) {  
                thes.buscarPersona(); 
            };
        },

        //Traer los datos de la búsqueda del material
        buscarPersona: function(){
            sap.ui.core.BusyIndicator.show(0);
            var oTable = this;
            var thes = this;
            var filter = [];
            var codMaterial = sap.ui.getCore().byId("busquedaMaterial--inCodMaterial").getValue();
            var newCod;
            if(codMaterial == ""){
                newCod = "";
            }else{
                newCod = thes.onCompleteFormat(codMaterial, 18);
            }
            var textBreve = sap.ui.getCore().byId("busquedaMaterial--inTextoBreve").getValue();

            var datos = [{"COD_MATERIAL": newCod, "TEXTO_BREVE": textBreve}];

            var filterPara = new sap.ui.model.Filter("Parametros", sap.ui.model.FilterOperator.EQ, JSON.stringify(datos));
                filter.push(filterPara);

            var filterPara2 = new sap.ui.model.Filter("Id", sap.ui.model.FilterOperator.EQ, "09");
                filter.push(filterPara2);
              
            //EntitySet es el entityset del metadata 
            oModel.read("/PRC_VEHICULOSSet" ,{
              method: "GET",
              filters: filter,
              success: function(result, status, xhr){
                if(JSON.parse(result.results[0].Json)[0].type == undefined){
                    var oModel = new JSONModel(JSON.parse(result.results[0].Json));
                    var oTable = sap.ui.getCore().byId("busquedaMaterial--tbBusqueda");
                    oTable.setModel(oModel);
                }else{
                    var oModel = new JSONModel();
                    var oTable = sap.ui.getCore().byId("busquedaMaterial--tbBusqueda");
                    oTable.setModel(oModel);
                }
                sap.ui.core.BusyIndicator.hide();
              },
              error: function(xhr,status,error){
                sap.m.MessageBox.error(xhr.statusText);
                sap.ui.core.BusyIndicator.hide();
              },
              urlParameters: {
                search: "GET"
              }

            });
        },

        //Cancelar la vista de búsqueda
        cancelarBusqueda: function(){
            this._oDialog.destroy();
        },

        //Seleccionar matrial de la búsqueda
        seleccionarBusqueda: function(oEvent){
            var codMat = oEvent.getSource().getBindingContext().getProperty("matnr");
            var modelo = oEvent.getSource().getBindingContext().getProperty("maktx");
            var unidad = oEvent.getSource().getBindingContext().getProperty("meins");
            var Materiales = this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "tblCotizacion")).getItems();

            $.each(Materiales, function(key, item){
                var oCells = Materiales[indexCont-1].mAggregations.cells;
                sap.ui.getCore().byId(oCells[0].sId).setValue(parseInt(codMat));
                sap.ui.getCore().byId(oCells[1].sId).setValue(modelo);
                sap.ui.getCore().byId(oCells[2].sId).setValue(unidad);
            });
            this._oDialog.destroy();
        },
        onCotizacion: function(){
            
        },
        onDialog: function(){
            this._oDialog = sap.ui.xmlfragment("sap.ui.veh_cotizacion.fragment.AddCotizacion", this);
            this._oDialog.open();
        },
        onClose: function(){
            this._oDialog.destroy();
        },
        onSelectionModeChange: function(oEvent){    
            var item = oEvent.getParameter("selectedItem").getKey();
            if(item == "Z097"){
                this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "negociador")).setVisible(true);
                this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "negociadortdp")).setVisible(true);
                this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "fecdesde")).setVisible(true);
                this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "motivo")).setVisible(true);
                this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "importe")).setVisible(true);
                var cotizacion = this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "tblCotizacion")).getItems();

                $.each(cotizacion, function(key, item){
                    cotizacion[key].mAggregations.cells[5].mProperties.visible = true;
                });
            }else if(item != "Z097"){
                this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "negociador")).setVisible(false);
                this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "negociadortdp")).setVisible(false);
                this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "fecdesde")).setVisible(false);
                this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "motivo")).setVisible(false);
                this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "importe")).setVisible(false);
                var cotizacion = this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "tblCotizacion")).getItems();

                $.each(cotizacion, function(key, item){
                    cotizacion[key].mAggregations.cells[5].mProperties.visible = false;
                });
            }
        },
        BotonCrear : function(){
            var oTable = this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "tc"));
        },

        //Botón función para buscar a la persona
        BuscarCliente: function(oEvent){
            sap.ui.core.BusyIndicator.show(0);
            var filter = [];
            var thes = this;
            var error = 0;
            var cliente = this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "cliente")).getValue();
            if(cliente != ""){

                if(thes.validaNumberM(this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "cliente")))){
                    error=1;
                }

                if(!error){
                    var datos = cliente;

                    var filterPara = new sap.ui.model.Filter("Parametros", sap.ui.model.FilterOperator.EQ, JSON.stringify(datos));
                        filter.push(filterPara);

                    var filterPara2 = new sap.ui.model.Filter("Id", sap.ui.model.FilterOperator.EQ, "01");
                        filter.push(filterPara2);
                      
                    //EntitySet es el entityset del metadata 
                    oModel.read("/PRC_VEHICULOSSet" ,{
                      method: "GET",
                      filters: filter,
                      success: function(result, status, xhr){
                        if(JSON.parse(result.results[0].Json).stcd1 == ""){
                            thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "idline")).setVisible(false);
                            thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "codSap1")).setVisible(false);
                            thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "nombre1")).setVisible(false);
                            thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "obs")).setRows(4);
                            thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "identfis1")).setVisible(false);
                            var dialog = new Dialog({
                                title: 'Aviso Importante',
                                type: 'Message',
                                content: new Text({ text: 'El cliente no existe, desea crear un cliente?' }),
                                beginButton: new Button({
                                    text: 'Si',
                                    press: function () {
                                        dialog.close();
                                        thes._oDialog9 = sap.ui.xmlfragment("nuevoCliente", "sap.ui.veh_cotizacion.fragment.CrearCliente", thes);
                                        thes._oDialog9.open();
                                        sap.ui.getCore().byId("nuevoCliente--dni").setValue(cliente);
                                        sap.ui.getCore().byId("nuevoCliente--ruc").setValue(cliente);
                                        sap.ui.getCore().byId("nuevoCliente--carnet").setValue(cliente);
                                    }
                                }),
                                endButton: new Button({
                                    text: 'No',
                                    press: function () {
                                        dialog.close();
                                    }
                                }),
                                afterClose: function() {
                                    dialog.destroy();
                                }
                            });

                            dialog.open();
                        }else{
                            thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "idline")).setVisible(true);
                            thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "codSap1")).setVisible(true);
                            thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "nombre1")).setVisible(true);
                            thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "identfis1")).setVisible(true);
                            thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "obs")).setRows(10);
                            thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "codSap")).setValue(parseInt(JSON.parse(result.results[0].Json).kunnr));
                            thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "nombre")).setValue(JSON.parse(result.results[0].Json).name1);
                            thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "identfis")).setValue(JSON.parse(result.results[0].Json).stcd1);
                        }
                        sap.ui.core.BusyIndicator.hide();
                      },
                      error: function(xhr,status,error){
                        sap.m.MessageBox.error(xhr.statusText);
                        sap.ui.core.BusyIndicator.hide();
                      },
                      urlParameters: {
                        search: "GET"
                      }

                    });
                }else{
                    sap.m.MessageBox.warning("En el campo de RUC/DNI solo se debe ingresar números.");
                    sap.ui.core.BusyIndicator.hide();
                }
            }else{
                sap.ui.core.BusyIndicator.hide();
            }
        },

        cambiarrdb: function(){
            var index = sap.ui.getCore().byId("nuevoCliente--rdbDocGroup").getSelectedIndex();
            if(index == 0){
                sap.ui.getCore().byId("nuevoCliente--lbldni").setVisible(true);
                sap.ui.getCore().byId("nuevoCliente--dni").setVisible(true);
                sap.ui.getCore().byId("nuevoCliente--lblruc").setVisible(false);
                sap.ui.getCore().byId("nuevoCliente--ruc").setVisible(false);
                sap.ui.getCore().byId("nuevoCliente--lblcarnet").setVisible(false);
                sap.ui.getCore().byId("nuevoCliente--carnet").setVisible(false);
            }else if(index == 1){
                sap.ui.getCore().byId("nuevoCliente--lbldni").setVisible(false);
                sap.ui.getCore().byId("nuevoCliente--dni").setVisible(false);
                sap.ui.getCore().byId("nuevoCliente--lblruc").setVisible(true);
                sap.ui.getCore().byId("nuevoCliente--ruc").setVisible(true);
                sap.ui.getCore().byId("nuevoCliente--lblcarnet").setVisible(false);
                sap.ui.getCore().byId("nuevoCliente--carnet").setVisible(false);
            }else if(index == 2){
                sap.ui.getCore().byId("nuevoCliente--lbldni").setVisible(false);
                sap.ui.getCore().byId("nuevoCliente--dni").setVisible(false);
                sap.ui.getCore().byId("nuevoCliente--lblruc").setVisible(false);
                sap.ui.getCore().byId("nuevoCliente--ruc").setVisible(false);
                sap.ui.getCore().byId("nuevoCliente--lblcarnet").setVisible(true);
                sap.ui.getCore().byId("nuevoCliente--carnet").setVisible(true);
            }
        },

        CrearCliente: function(){
            sap.ui.core.BusyIndicator.show(0);
            var thes = this;
            var rdbOpcion = 1;
            var filter = [];
            var error = 0;
            var campo;
            var index = sap.ui.getCore().byId("nuevoCliente--rdbDocGroup").getSelectedIndex();
            if(index == 0){
                var documento = sap.ui.getCore().byId("nuevoCliente--dni").getValue();
                rdbOpcion = 1;
                campo = sap.ui.getCore().byId("nuevoCliente--dni");
            }else if(index == 1){
                var documento = sap.ui.getCore().byId("nuevoCliente--ruc").getValue();
                rdbOpcion = 2;
                campo = sap.ui.getCore().byId("nuevoCliente--ruc");
            }else if(index == 2){
                var documento = sap.ui.getCore().byId("nuevoCliente--carnet").getValue();
                rdbOpcion = 3;
                campo = sap.ui.getCore().byId("nuevoCliente--carnet");
            }

            if(thes.validaNumberM(campo)){
                error=1;
            }

            if(!error){
                var nombrecli = sap.ui.getCore().byId("nuevoCliente--nombrecli").getValue();
                var direccion = sap.ui.getCore().byId("nuevoCliente--direccion").getValue();
                var ciudad = sap.ui.getCore().byId("nuevoCliente--ciudad").getValue();
                var nombrecon = sap.ui.getCore().byId("nuevoCliente--nombrecon").getValue();

                var datos = [{"NIF": documento, "NOMBRE": nombrecli, "DIRECCION": direccion, "CIUDAD": ciudad, "CONTACTO": nombrecon, "TIPCLI": rdbOpcion.toString()}];

                var filterPara = new sap.ui.model.Filter("Parametros", sap.ui.model.FilterOperator.EQ, JSON.stringify(datos));
                    filter.push(filterPara);

                var filterPara2 = new sap.ui.model.Filter("Id", sap.ui.model.FilterOperator.EQ, "01");
                    filter.push(filterPara2);
                  
                //EntitySet es el entityset del metadata 
                oModel.read("/PRC_VEHICULOSSet" ,{
                  method: "POST",
                  filters: filter,
                  success: function(result, status, xhr){
                    if(JSON.parse(result.results[0].Json).length == 0){
                        sap.m.MessageBox.success("Cliente creado exitosamente.");
                        thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "idline")).setVisible(true);
                        thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "obs")).setRows(10);
                        thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "codSap1")).setVisible(true);
                        thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "nombre1")).setVisible(true);
                        thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "identfis1")).setVisible(true);
                        thes.BuscarCliente();
                        thes._oDialog9.destroy();
                    }else{
                        sap.m.MessageBox.warning(JSON.parse(result.results[0].Json)[0].message);
                    }
                    sap.ui.core.BusyIndicator.hide();
                  },
                  error: function(xhr,status,error){
                    sap.m.MessageBox.error(xhr.statusText);
                    sap.ui.core.BusyIndicator.hide();
                  },
                  urlParameters: {
                    search: "POST"
                  }

                });
            }else{
                sap.m.MessageBox.error("Debe llenar el DNI/RUC/Carnet de extranjería y solo se debe ingresar números.");
                sap.ui.core.BusyIndicator.hide();
            }
        },

        CerrarCrearCliente: function(){
            this._oDialog9.destroy();
        },

        guardarCotizacion: function(){
            sap.ui.core.BusyIndicator.show(0);
            var thes = this;
            var rdbOpcion = 1;
            var error = 0;
            var odatos = [];
            var filter = [];
            var selectTipoCoti = thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "selectTipoCoti")).getSelectedKey();
            var txtConcesionario = thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "txtConcesionario")).getValue();
            var cliente = thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "cliente")).getValue();
            var obs = thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "obs")).getValue();

            var negociador = thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "negociador2")).getValue();
            var negociadortdp = thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "negociadortdp2")).getValue();
            var fecdesde = thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "fecdesde2")).getValue();
            var motivo = thes.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "motivo2")).getValue();

            if(cliente != ""){
                var cotizacion = this.byId(sap.ui.core.Fragment.createId("frgAddCotizacion", "tblCotizacion")).getItems();
                if(cotizacion.length != 0){
                    $.each(cotizacion, function(key, item){
                        var oCells = item.mAggregations.cells;

                        var elemento = {
                            'mabnr': oCells[0].mProperties.value,
                            'maktx': oCells[1].mProperties.value,
                            'vrkme': oCells[2].mProperties.value,
                            'anio': oCells[3].mProperties.selectedKey,
                            'kwmeng': oCells[4].mProperties.value,
                            'motivo': oCells[5].mProperties.value,
                            'importe': oCells[6].mProperties.value
                        };
						if(selectTipoCoti == "Z097"){
							if(oCells[0].mProperties.value == "" || oCells[1].mProperties.value == "" || oCells[2].mProperties.value == "" || oCells[3].mProperties.value == "" || oCells[4].mProperties.value == "" || oCells[6].mProperties.value == ""){
                            	error=1;
                        	}	
						}else{
							if(oCells[0].mProperties.value == "" || oCells[1].mProperties.value == "" || oCells[2].mProperties.value == "" || oCells[3].mProperties.value == "" || oCells[4].mProperties.value == ""){
                            	error=1;
                        	}
						}
                        odatos.push(elemento);
                    });
                    if(!error){
                        var datos1 = [{"AUART": selectTipoCoti, "STCD1": cliente, "KUNNR": txtConcesionario, "TEXT_LINE": obs, "N_DEALER": negociador, "N_TDP": negociadortdp, "N_FECHA": fecdesde, "MOTIVO": motivo}];

                        var filterPara = new sap.ui.model.Filter("Json", sap.ui.model.FilterOperator.EQ, JSON.stringify(odatos));
                            filter.push(filterPara);

                        var filterPara2 = new sap.ui.model.Filter("Parametros", sap.ui.model.FilterOperator.EQ, JSON.stringify(datos1));
                            filter.push(filterPara2);

                        var filterPara3 = new sap.ui.model.Filter("Id", sap.ui.model.FilterOperator.EQ, "02");
                            filter.push(filterPara3);
                          
                        //EntitySet es el entityset del metadata 
                        oModel.read("/PRC_VEHICULOSSet" ,{
                          method: "POST",
                          filters: filter,
                          success: function(result, status, xhr){
                            var mensaje = '';
                            $.each(JSON.parse(result.results[0].Json), function(i, v) {
                                if(mensaje != ''){
                                    mensaje += '\n' + '- ' + v.message;
                                }else{
                                    mensaje += '- ' + v.message;
                                }
                            });
                            sap.m.MessageBox.warning(mensaje);
                            sap.ui.core.BusyIndicator.hide();
                          },
                          error: function(xhr,status,error){
                            sap.m.MessageBox.error(xhr.statusText);
                            sap.ui.core.BusyIndicator.hide();
                          },
                          urlParameters: {
                            search: "POST"
                          }
                        });
                    }else{
                        sap.m.MessageBox.error("Debe completar todos los datos del Material.");
                        sap.ui.core.BusyIndicator.hide();
                    }
                }else{
                    sap.m.MessageBox.error("Debe ingresar por lo menos un material para la cotización.");
                    sap.ui.core.BusyIndicator.hide();
                }
            }else{
                sap.m.MessageBox.error("Debe ingresar un cliente.");
                sap.ui.core.BusyIndicator.hide();
            }
        },
		//----------------------------LISTADO COTIZACIONES
		getSelectedIndices: function(oEvent){
			var index = this.getView().byId("frgReporte--tblVisualizarT").getTable().getSelectedItems();
			if(index.length > 0){
				var Cells = index[0].mAggregations.cells;
				var VBLEN = this.onCompleteFormat(Cells[0].mProperties.text, 10);
				var KUNNR = this.onCompleteFormat(Cells[6].mProperties.text, 10);
				var CLASE = Cells[3].mProperties.text
                this.getDetalle(VBLEN, KUNNR, this, CLASE);
			}else{
			    MessageBox.error("Debe Seleccionar una fila");
			}
		},
		getDetalle: function(vblen, kunnr, that, clase){
            sap.ui.core.BusyIndicator.show(0); // mostrando la barra de Busy
            var jsonParametros = {
            	"VBELN" : vblen,
            	"KUNNR" : kunnr
            };
            jsonParametros = JSON.stringify(jsonParametros);
            
            var Filter1 = [];
            var Filter = [];
            Filter = new sap.ui.model.Filter("Id", sap.ui.model.FilterOperator.EQ, "12");
            Filter1.push(Filter);
            Filter = new sap.ui.model.Filter("Parametros", sap.ui.model.FilterOperator.EQ, jsonParametros);
            Filter1.push(Filter);
            
            oModel.read("/PRC_VEHICULOSSet", {
            	method: "GET",
            	filters: Filter1,
            	urlParameters: {
            		"search" : "GET"
            	},
            	success: function(result, status, xhr){
            		var result = JSON.parse(result.results[0].Json);
            		var Cliente = result.cliente;
                    var DataDetalle1 = new JSONModel(result.detalle);
                    that._oDialog = sap.ui.xmlfragment("sap.ui.veh_cotizacion.fragment.VerDetalle", that);
                    if(clase == "Cot. Unid. Flota"){
                    	sap.ui.getCore().byId("ColumFlota1").setVisible(true);
                    	sap.ui.getCore().byId("ColumFlota2").setVisible(true);
                    	sap.ui.getCore().byId("ColumFlota3").setVisible(true);
                    }else if(clase == "Cot. Acuerd Especial"){
                    	sap.ui.getCore().byId("ColumEspe1").setVisible(true);
                    	sap.ui.getCore().byId("ColumEspe2").setVisible(true);
                    	sap.ui.getCore().byId("ColumEspe3").setVisible(true);
                    }else if(clase == "Cot. Unid. Endoso"){
                    	sap.ui.getCore().byId("ColumEndoso1").setVisible(true);
                    	sap.ui.getCore().byId("ColumEndoso2").setVisible(true);
                    	sap.ui.getCore().byId("ColumEndoso3").setVisible(true);
                    }
                    sap.ui.getCore().byId("cliente").setValue(Cliente[0].name1);
                    sap.ui.getCore().byId("contacto").setValue(Cliente[0].name2);
                    sap.ui.getCore().byId("nro_ident").setValue(Cliente[0].stcd1);
                    sap.ui.getCore().byId("observaciones").setValue(Cliente[0].obs);
                    sap.ui.getCore().byId("TBDetalles").setModel(DataDetalle1);
                    that._oDialog.open();
            		sap.ui.core.BusyIndicator.hide();
            	},
            	error: function(){
            		sap.ui.core.BusyIndicator.hide();
            	}
            });
        },
        onExportExcel: sap.m.Table.prototype.exportData || function(oEvent){
        	var oExport = new Export({
				exportType : new ExportTypeCSV({
					separatorChar : ",",
                	charset : "utf-8"
				}),
				// OBTENER EL MODELO
				models : sap.ui.getCore().byId("TBDetalles").getModel(),
				// FILAS
				rows : {
					path : "/"
				},
				//COLUMNAS
				columns : [
					{
						name : "Posición",
						template : {
							content : "{posnr}"
						}
					}, {
						name : "Material",
						template : {
							content : "{mabnr}"
						}
					}, {
						name : "Denominación",
						template : {
							content : "{maktx}"
						}
					}, {
						name: "Ctd. de Pedido",
						template: {
							content: {
								parts: ["kwmeng"],
								formatter : function(value){
									try {
										return (value) ? parseFloat(value).toFixed(0) : value;
									} catch (err) {
										return "Not-A-Number";
									}
								}
							}
						}
					}, {
						name: "UM Venta",
						template: {
							content: "UN"
						}
					}, {
						name: "Año Fab.",
						template: {
							content: "{anio}"
						}
					}, {
						name: "",
						template: {
							content: "{text}"
						}
					}
				]
			});
			// download exported file
			oExport.saveFile("ListaDeMateriales").catch(function(oError) {
				MessageBox.error("Error!\n\n" + oError);
			}).then(function() {
				oExport.destroy();
			});
        },
        onCloseDialog: function(){
    		this._oDialog.destroy();
        },
		onPressItem: function(){
			tableuse = "frgReporte--tblVisualizarT";
			
			this.getView().byId("frgReporte--tblVisualizarT").setVisible(true);
			this.getView().byId("frgReporte--botonVolver").setVisible(true);
			this.getView().byId("frgReporte--tblVisualizarM").setVisible(false);
			
			click = clk_t;
			this.goTo(click);
			
			if(click == 1) this.getView().byId("frgReporte--btnAnterior").setEnabled(false);
			else this.getView().byId("frgReporte--btnAnterior").setEnabled(true);
		},
		onVolver: function(){
			tableuse = "frgReporte--tblVisualizarM";
			
			this.getView().byId("frgReporte--tblVisualizarT").setVisible(false);
			this.getView().byId("frgReporte--botonVolver").setVisible(false);
			this.getView().byId("frgReporte--tblVisualizarM").setVisible(true);
			
			click = clk_m;
			this.goTo(click);
			
			if(click == 1) this.getView().byId("frgReporte--btnAnterior").setEnabled(false);
			else this.getView().byId("frgReporte--btnAnterior").setEnabled(true);
		},
		onShow: function(oEvent){
			click = 1;
			this.goTo(click);
		},
		onLoadM: function(oEvent){ //Evento se activa cuando trae data el smart table mobile
			var tblcant = this.getView().byId(tableuse).getTable().getItems().length;
			
			if(tblcant == 0){
			
			this.getView().byId("frgReporte--btnSiguiente").setEnabled(false);
			this.getView().byId("frgReporte--btnAnterior").setEnabled(false);
			
			}else{
			this.getView().byId("frgReporte--btnSiguiente").setEnabled(true);
			this.getView().byId("frgReporte--btnAnterior").setEnabled(true);
			}
			
			this.goTo(click);
			
			if(click == 1) this.getView().byId("frgReporte--btnAnterior").setEnabled(false);
			else this.getView().byId("frgReporte--btnAnterior").setEnabled(true);
		},
		onLoadT: function(oEvent){ //Evento se activa cuando trae data el smart table desktop
            sap.ui.core.BusyIndicator.hide();
			var tblcant = this.getView().byId(tableuse).getTable().getItems().length;
			if(tblcant == 0){
			
			this.getView().byId("frgReporte--btnSiguiente").setEnabled(false);
			this.getView().byId("frgReporte--btnAnterior").setEnabled(false);
			
			}else{
			
			this.getView().byId("frgReporte--btnSiguiente").setEnabled(true);
			this.getView().byId("frgReporte--btnAnterior").setEnabled(true);
			
			}
			
			this.goTo(click);
			
			if(click == 1) this.getView().byId("frgReporte--btnAnterior").setEnabled(false);
			else this.getView().byId("frgReporte--btnAnterior").setEnabled(true);
		},
		range: function(oInit, oEnd, oData){
			$.each(oData, function(key, item){
			    var sId = item.sId;
			
			    if(key >= oInit && key <= oEnd){
			     sap.ui.getCore().byId(sId).setVisible(true);
			    }else{                    
			     sap.ui.getCore().byId(sId).setVisible(false);
			    }
			});
		},
		
		goTo: function(oClick){
			var oSelectItem = this.getView().byId("frgReporte--sShow").getSelectedKey();
			var oTable =  this.getView().byId(tableuse).getTable().getItems();
			var oTotal = oTable.length;
			var oShow = Math.ceil(oTotal / oSelectItem);
			
			if(oClick <= oShow){
			
			   if(oShow == oClick){
			      this.getView().byId("frgReporte--btnSiguiente").setEnabled(false);
			   }else{
			      this.getView().byId("frgReporte--btnSiguiente").setEnabled(true);
			   }
			   
			   this.range(oSelectItem * (oClick - 1), (oSelectItem * oClick) - 1, oTable);
			}
			
			if(oClick <= 1){
			  this.getView().byId("frgReporte--btnAnterior").setEnabled(false);
			}    
		},
		
		goNext: function(){
			this.goTo(click += 1); 
			
			if(tableuse == "frgReporte--tblVisualizarM") clk_m = click;
			else clk_t = click;
			
			if(click != 0){
			    this.getView().byId("frgReporte--btnAnterior").setEnabled(true);
			}else{
			    this.getView().byId("frgReporte--btnAnterior").setEnabled(false);
			}
		},
		goPrevious: function(){
			this.goTo(click -= 1);
			
			if(tableuse == "frgReporte--tblVisualizarM") clk_m = click;
			else clk_t = click;
			
			if(click <= 1){
			    this.getView().byId("frgReporte--btnAnterior").setEnabled(false);
			}else{
			    this.getView().byId("frgReporte--btnAnterior").setEnabled(true);
			}
		},
		onBuscarDatos: function(){
            sap.ui.core.BusyIndicator.show(0);
			var DocCliente = this.getView().byId("frgReporte--idDocCliente").getValue();
			var NomCliente = this.getView().byId("frgReporte--idNomCliente").getValue();
			var FecDesde = this.getView().byId("frgReporte--idFecDesde").getValue();
			var FecHasta = this.getView().byId("frgReporte--idFecHasta").getValue();
			
			var FormattedDate1 = new Date(FecDesde +" 05:00");
			var FormattedDate2 = new Date(FecHasta +" 05:00");
			
			var aFilter = [];
			
			if (DocCliente != "") {
			  aFilter.push(
			    new Filter("Stcd1", FilterOperator.EQ, DocCliente)
			  );
			}
			
			if (NomCliente != "") {
			  aFilter.push(
			    new Filter("Name1", FilterOperator.EQ, NomCliente)
			  );
			}
			
			if(FecDesde != "" && FecHasta != ""){
			  aFilter.push(
			    new Filter("Erdat", FilterOperator.BT,FormattedDate1,FormattedDate2)
			  );
			}
			
			var oList = this.getView().byId("frgReporte--tblVisualizarT").getTable();
			var oBinding = oList.getBinding("items");
			oBinding.filter(aFilter);
			
			var oList1 = this.getView().byId("frgReporte--tblVisualizarM").getTable();
			var oBinding1 = oList1.getBinding("items");
			oBinding1.filter(aFilter);
		},
		onNavBack: function(){
        	window.history.back();
		},
		onValidateNumber: function(event){
			var id = event.getParameters().id;
            var vista = sap.ui.getCore().byId(id);
            var myPattern = (/^[0-9]*$/);
            var texto = vista.getValue();

            if(!texto.match(myPattern)){
                vista.focus();
                vista.setValueState("Error");
                vista.setValueStateText("Sólo se permite el ingreso de números");
                return true;
            }else if(texto == ""){
                vista.setValueState("Error");
                vista.setValueStateText("Este campo es obligatorio");
                return false;
            }else{
                vista.setValueState("None");
                vista.setValueStateText("");
                return false;
            }
        },
        validaNumberM: function(e){
            console.log(e);
            var vista = e;
            var myPattern = (/^[0-9]*$/);
            var texto = vista.getValue();

            if(!texto.match(myPattern)){
                vista.focus();
                vista.setValueState("Error");
                vista.setValueStateText("Sólo se permite el ingreso de números");
                return true;
            }else{
                vista.setValueState("None");
                vista.setValueStateText("");
                return false;
            }

        },

        validaNumberC: function(e){
            console.log(e);
            var vista = e;
            var texto = vista.getValue();

            if(parseFloat(texto) != texto && texto != ""){
                vista.setValueState("Error");
                vista.setValueStateText("Sólo se permite el ingreso de números");
                return true;
            }else if(texto == ""){
                vista.setValueState("Error");
                vista.setValueStateText("Este campo es obligatorio");
                return false;
            }else{
                vista.setValueState("None");
                vista.setValueStateText("");
                return false;
            }
        },
        onBeforeTBL: function(Event){
            Event.mParameters.bindingParams; //Breakpoint o console.log(oEvent.mParameters.bindingParams)
             console.log(Event.mParameters.bindingParams);
        }
	});
});
