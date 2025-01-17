"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketType = void 0;
var PacketType;
(function (PacketType) {
    PacketType[PacketType["Hello"] = 1868784496] = "Hello";
    PacketType[PacketType["Bye"] = 4] = "Bye";
    PacketType[PacketType["LoginResultOld"] = 6] = "LoginResultOld";
    PacketType[PacketType["LoginResult"] = 7] = "LoginResult";
    PacketType[PacketType["Login"] = 30] = "Login";
    // TODO: screenshots!
    PacketType[PacketType["ScreenShot"] = 8] = "ScreenShot";
    PacketType[PacketType["ScreenShotResult"] = 9] = "ScreenShotResult";
    PacketType[PacketType["Boot"] = 10] = "Boot";
    PacketType[PacketType["BootResult"] = 11] = "BootResult";
    PacketType[PacketType["OskStart"] = 12] = "OskStart";
    PacketType[PacketType["OskStartResult"] = 13] = "OskStartResult";
    PacketType[PacketType["OskChangeString"] = 14] = "OskChangeString";
    PacketType[PacketType["OskControl"] = 16] = "OskControl";
    PacketType[PacketType["ServerStatus"] = 18] = "ServerStatus";
    PacketType[PacketType["Status"] = 20] = "Status";
    PacketType[PacketType["Standby"] = 26] = "Standby";
    PacketType[PacketType["StandbyResult"] = 27] = "StandbyResult";
    PacketType[PacketType["RemoteControl"] = 28] = "RemoteControl";
    PacketType[PacketType["Handshake"] = 32] = "Handshake";
    // discovered these, but not sure what they do:
    PacketType[PacketType["BufferSize"] = 2] = "BufferSize";
    PacketType[PacketType["BufferSizeResult"] = 3] = "BufferSizeResult";
    PacketType[PacketType["HttpdStatus"] = 22] = "HttpdStatus";
    PacketType[PacketType["ScreenStatus"] = 24] = "ScreenStatus";
    PacketType[PacketType["Logout"] = 34] = "Logout";
    PacketType[PacketType["LogoutResult"] = 35] = "LogoutResult";
    PacketType[PacketType["Boot2"] = 36] = "Boot2";
    PacketType[PacketType["BootResult2"] = 37] = "BootResult2";
    PacketType[PacketType["ClientAppInfoStatus"] = 38] = "ClientAppInfoStatus";
    PacketType[PacketType["BootDialogCancel2"] = 40] = "BootDialogCancel2";
    PacketType[PacketType["CommentViewerStart"] = 42] = "CommentViewerStart";
    PacketType[PacketType["CommentViewerStartResult"] = 43] = "CommentViewerStartResult";
    PacketType[PacketType["CommentViewerNewComment"] = 44] = "CommentViewerNewComment";
    PacketType[PacketType["CommentViewerNewCommentHalf"] = 46] = "CommentViewerNewCommentHalf";
    PacketType[PacketType["CommentViewerEvent"] = 48] = "CommentViewerEvent";
    PacketType[PacketType["CommentViewerEventSendComment"] = 50] = "CommentViewerEventSendComment";
})(PacketType = exports.PacketType || (exports.PacketType = {}));
