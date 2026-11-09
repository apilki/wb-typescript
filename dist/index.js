"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.core = exports.documents = exports.finances = exports.sellerAnalytics = exports.reports = exports.analytics = exports.returns = exports.buyerChat = exports.communications = exports.dpCalendar = exports.advertMedia = exports.promotion = exports.ordersFbw = exports.inStorePickup = exports.dbs = exports.ordersDbw = exports.ordersFbs = exports.marketplace = exports.discountsPrices = exports.items = exports.userManagement = exports.feedbacks = exports.general = void 0;
/* Сгенерировано генератором клиента WB. Правки не сохраняются: меняйте рецепты. */
/* Каждый раздел API — своё пространство имён: у модулей пересекаются имена runtime. */
exports.general = require("./modules/01-general");
exports.feedbacks = require("./modules/01-general--feedbacks");
exports.userManagement = require("./modules/01-general--user-management");
exports.items = require("./modules/02-items");
exports.discountsPrices = require("./modules/02-items--discounts-prices");
exports.marketplace = require("./modules/02-items--marketplace");
exports.ordersFbs = require("./modules/03-orders-fbs");
exports.ordersDbw = require("./modules/04-orders-dbw");
exports.dbs = require("./modules/05-dbs");
exports.inStorePickup = require("./modules/06-in-store-pickup");
exports.ordersFbw = require("./modules/07-orders-fbw");
exports.promotion = require("./modules/08-promotion");
exports.advertMedia = require("./modules/08-promotion--advert-media");
exports.dpCalendar = require("./modules/08-promotion--dp-calendar");
exports.communications = require("./modules/09-communications");
exports.buyerChat = require("./modules/09-communications--buyer-chat");
exports.returns = require("./modules/09-communications--returns");
exports.analytics = require("./modules/11-analytics");
exports.reports = require("./modules/12-reports");
exports.sellerAnalytics = require("./modules/12-reports--seller-analytics");
exports.finances = require("./modules/13-finances");
exports.documents = require("./modules/13-finances--documents");
exports.core = require("./core/index");
