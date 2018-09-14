/**
 * 场景值-id 的选择组件
 **/

define(["jquery"], function ($) {

    'use strict';

    $.prototype.initSceneSelector = function (options) {
        return new SceneSelector(this, options);
    };

    function SceneSelector(jqobj, options) {
        var thisobj = this;
        this.jqobj = jqobj;
        this.options = $.extend({}, thisobj.defaultOptions, options);
        this.identifier = this.getDefaultIdentifier(this.options.identifier || "");
        this.globalData = {
            config: null,
            search: "",
            groupid: 0,
            checks: [],
            real_checks: []
        };
        this.initConfig(function(){
			thisobj.init();
		});
		
    }

    SceneSelector.prototype = {
        defaultOptions: {
            empty_val_show: "",
            position: "bottom"               //弹框的位置 默认是下方 左对齐  可以填写 top（上方左对齐）  top_middle bottom_middle
        },

        getDefaultIdentifier: function (name) {
            var identifier = "demo_scene_selector_";
            if (name) {
                identifier += name;
            } else {
                var index = 0;
                while ($("body").find("#" + identifier + "identifer_" + index).length > 0) {
                    index++;
                }
                return this.getDefaultIdentifier("identifer_" + index);
            }
            return identifier;
        },

        initConfig: function (callback) {
            var thisobj = this;
			$.getJSON("js/scene.json", function(data) {
				thisobj.globalData.config = data;
				if(callback) {
					callback();
				}
			});
        },

        init: function () {
            this.initDom();
            this.initEvent();
        },

        initDom: function () {
            var thisobj = this;
            var identifier = this.identifier;
            var position = this.options.position;
            this.selectorObj = $("<div class='scene-selector' id='" + identifier + "'></div>");
            //selector的主要展示container
            this.showContainerObj = $("<div class='show-container'><div class='text fl'>" + (thisobj.options.empty_val_show || "请选择场景值ID") + "</div><div class='fold-icon fr'></div></div>");
            //已选场景提示信息的container
            this.tipContainerObj = $("<div class='tip-container'><div class='content'></div></div>");
            //选择场景信息的container
            this.chooseContainerObj = $("<div class='choose-container " + position + "'>" +
                "<div class='filter'>" +
                "   <div class='fl'>" +
                "       <input class='check-all' type='checkbox' id='" + identifier + "_checkall'>" +
                "       <label class='cursor-label' for='" + identifier + "_checkall'>全选</label>" +
                "   </div>" +
                "   <div class='fr'>" +
                "       <span>场景值分类</span>" +
                "       <select name='scene-group-select' style='width: 120px'>" + this.getSceneGroupSelectorOptionsHtml() + "</select>" +
                "       <div class='fr search-container ml-12'>" +
                "           <input class='search-input' placeholder='场景值ID或描述' type='text' id='" + identifier + "_search'>" +
                "           <div class='search-icon fr'></div>" +
                "       </div>" +
                "   </div>" +
                "</div>" +
                "<div class='body scroll'></div>" +
                "<div class='foot fr'>" +
                "   <span class='cancel btn btn-default'>取消</span>" +
                "   <span class='clear btn btn-default ml-12'>清空</span>" +
                "   <span class='submit btn btn-primary ml-12'>确定</span>" +
                "</div>" +
                "</div>");

            this.selectorObj.append(thisobj.showContainerObj);
            this.selectorObj.append(thisobj.tipContainerObj);
            this.selectorObj.append(thisobj.chooseContainerObj);
            var offset = this.jqobj.offset();

            this.jqobj2 = $("<div name='scene-selector-wrapper'></div>");

            this.jqobj2.css({
                left: offset.left,
                top: offset.top,
                position: "absolute"
            });
            this.jqobj2.append(this.selectorObj);
            $("body").append(thisobj.jqobj2);
            this.freshAll();
        },

        getSceneGroupSelectorOptionsHtml: function () {
            var sceneConfig = this.getSceneConfig();
            var groupids = [];
            var groupid;
            var options = "<option value='0'>全部</option>";
            for (var i = 0, l = sceneConfig.length; i < l; i++) {
                groupid = sceneConfig[i].groupid;
                if (groupids.indexOf(groupid) < 0) {
                    groupids.push(groupid);
                    options += "<option value='" + groupid + "'>" + sceneConfig[i].group + "</option>";
                }
            }
            return options;
        },

        initEvent: function () {
            var thisobj = this;
            var thisjq = this.jqobj2;
            var hideTipContainerTimer;

            thisjq.on("click", ".show-container", function () {
                thisjq.find(".scene-selector").addClass("selected");
            });

            thisjq.on("mouseenter mouseleave", ".show-container", function (e) {
                if (thisjq.find(".scene-selector").hasClass("selected")) {
                    thisjq.find(".scene-selector").removeClass("focus");
                    return;
                }
                if (e.type === "mouseenter") {
                    if (thisobj.globalData.checks.length > 0) {
                        thisjq.find(".scene-selector").addClass("focus");
                    }
                    clearTimeout(hideTipContainerTimer);
                } else {
                    hideTipContainerTimer = setTimeout(function () {
                        thisjq.find(".scene-selector").removeClass("focus");
                    }, 400);
                }
            });

            thisjq.on("mouseenter mouseleave", ".tip-container", function (e) {
                clearTimeout(hideTipContainerTimer);
                if (thisjq.find(".scene-selector").hasClass("selected")) {
                    thisjq.find(".scene-selector").removeClass("focus");
                    return;
                }
                if (e.type === "mouseenter") {
                    thisjq.find(".scene-selector").addClass("focus");
                } else {
                    hideTipContainerTimer = setTimeout(function () {
                        thisjq.find(".scene-selector").removeClass("focus");
                    }, 400);
                }
            });

            //搜索输入框输入
            thisjq.on("keyup change", ".search-input", function () {
                thisobj.globalData.search = $(this).val();
                thisobj.freshChooseContainer();
            });

            thisjq.on("click", ".search-icon", function () {
                thisjq.find(".search-input").trigger("keyup");
            });

            //场景分类筛选
            thisjq.on("change", "select[name='scene-group-select']", function () {
                thisobj.globalData.groupid = $(this).val();
                thisobj.freshChooseContainer();
            });

            //全选
            thisjq.on("click", ".check-all", function () {
                var vals = [];
                thisjq.find(".body input[name='check']").each(function (index, obj) {
                    vals.push($(obj).val());
                });
                var isSelectAll = $(this).prop("checked");
                var index;
                for (var i = 0; i < vals.length; i++) {
                    index = thisobj.globalData.checks.indexOf(vals[i]);
                    if (isSelectAll && index < 0) {
                        thisobj.globalData.checks.push(vals[i]);
                    }

                    if (!isSelectAll && index >= 0) {
                        thisobj.globalData.checks.splice(index, 1);
                    }
                }
                thisobj.freshAll();
            });

            thisjq.on("click", ".body input[name='check']", function () {
                var val = $(this).val();
                if ($(this).prop("checked")) {
                    thisobj.globalData.checks.push(val);
                } else {
                    var index = thisobj.globalData.checks.indexOf(val);
                    if (index >= 0) {
                        thisobj.globalData.checks.splice(index, 1);
                    }
                }
                thisobj.freshAll();
            });

            /**取消**/
            thisjq.on("click", ".choose-container .cancel", function () {
                thisobj.resetChecks();
                thisobj.freshAll();
                thisjq.find(".scene-selector").removeClass("selected");
                if (thisobj.options.cancelCallback && typeof thisobj.options.cancelCallback === "function") {
                    thisobj.options.cancelCallback(thisobj)
                }
            });

            /**清空**/
            thisjq.on("click", ".choose-container .clear", function () {
                thisobj.globalData.checks.length = 0;
                thisobj.freshAll();
            });

            /**确定**/
            thisjq.on("click", ".choose-container .submit", function () {
                thisobj.resetRealChecks();
                thisjq.find(".scene-selector").removeClass("selected");
                if (thisobj.options.confirmCallback && typeof thisobj.options.confirmCallback === "function") {
                    thisobj.options.confirmCallback(thisobj)
                }
            });
        },

        getSceneConfig: function () {
            return this.globalData.config;
        },

        freshAll: function () {
            this.freshShowContainer();
            this.freshTipContainer();
            this.freshChooseContainer();
        },

        freshShowContainer: function () {
            var textObj = this.jqobj2.find(".show-container").find(".text");
            var content = this.options.empty_val_show || "请选择场景值ID";
            if (this.globalData.checks.length > 0) {
                content = this.globalData.checks.join(",");
            }
            textObj.html(content);
        },

        freshTipContainer: function () {
            var contentObj = this.jqobj2.find(".tip-container").find(".content");
            var content = "";
            if (this.globalData.checks.length > 0) {
                var contentArr = [];
                var sceneConfig = this.getSceneConfig();
                var checks = this.globalData.checks;
                for (var i = 0, l = sceneConfig.length; i < l; i++) {
                    if (checks.indexOf(sceneConfig[i].id) >= 0) {
                        contentArr.push(" " + sceneConfig[i].id + " " + sceneConfig[i].description);
                    }
                }
                content = contentArr.join(";");
            }
            contentObj.html(content);
        },

        freshChooseContainer: function () {
            var choosePannel = this.jqobj2.find(".choose-container").find(".body");
            var search = this.globalData.search.trim();
            var groupid = parseInt(this.globalData.groupid) || 0;
            var checks = this.globalData.checks;
            var identifier = this.identifier;
            var sceneConfig = this.getSceneConfig();
            var content = "";
            var scene_id;
            var scene_description;
            var checkbox_identifier_id;
            for (var i = 0, l = sceneConfig.length; i < l; i++) {
                scene_id = sceneConfig[i].id;
                scene_description = sceneConfig[i].description;
                if(groupid > 0 &&  sceneConfig[i].groupid != groupid) {
                    continue;
                }
                if (search.length <= 0 || (search.length > 0 && (scene_id.indexOf(search) >= 0 || scene_description.indexOf(search) >= 0))) {
                    checkbox_identifier_id = identifier + "_" + scene_id;
                    content += '<div class="item">' +
                        '<input type="checkbox" name="check" value="' + scene_id + '" id="' + checkbox_identifier_id + '" ' + (checks.indexOf(scene_id) >= 0 ? "checked" : "") + '>' +
                        '<label for="' + checkbox_identifier_id + '" class="cursor-label">' + scene_id + '</label>' +
                        '-' +
                        '<div class="item-description" title="' + scene_description + '">' +
                        '<label for="' + checkbox_identifier_id + '" class="cursor-label">' + scene_description + '</label>' +
                        '</div>' +
                        '</div>'
                }
            }

            choosePannel.html(content);

            var checkAllObj = this.jqobj2.find(".check-all");
            var isSelectAll = choosePannel.find("input[name='check']:checked").length === choosePannel.find("input[name='check']").length;
            checkAllObj.prop("checked", isSelectAll);
        },

        resetChecks: function () {
            var real_checks = this.globalData.real_checks;
            this.globalData.checks = JSON.parse(JSON.stringify(real_checks));
        },

        resetRealChecks: function () {
            var checks = this.globalData.checks;
            this.globalData.real_checks = JSON.parse(JSON.stringify(checks));
        },

        getSelectedIds: function () {
            return this.globalData.real_checks;
        }

    };

    return SceneSelector;

});