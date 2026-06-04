/*!
 * jquery.confirm
 *
 * @version 2.3.1
 *
 * @author My C-Labs
 * @author Matthieu Napoli <matthieu@mnapoli.fr>
 * @author Russel Vela
 * @author Marcus Schwarz <msspamfang@gmx.de>
 *
 * @license MIT
 * @url http://myclabs.github.io/jquery.confirm/
 */
(function ($) {

    /**
    * Confirm a link or a button
    * @param [options] {{title, text, confirm, cancel, okButton, cancelButton, post, okButtonClass}}
    */
    $.fn.confirm = function (options) {
        if (typeof options === 'undefined') {
            options = {};
        }

        this.click(function (e) {
            e.preventDefault();

            var newOptions = $.extend({
                button: $(this)
            }, options);

            $.confirm(newOptions, e);
        });

        return this;
    };

    /**
    * Show a confirmation dialog
    * @param [options] {{title, text, confirm, cancel, okButton, cancelButton, post, okButtonClass}}
    * @param [e] {Event}
    */
    $.confirm = function (options, e) {

        // Do nothing when active confirm modal.
        if ($('.confirmation-modal').length > 0)
            return;


        // Parse options defined with "data-" attributes
        var dataOptions = {};
        if (options.button) {
            var dataOptionsMapping = {
                'title': 'title',
                'text': 'text',
                'confirm-button': 'okButton',
                'cancel-button': 'cancelButton',
                'confirm-button-class': 'okButtonClass',
                'alert': 'alert',
                'width': 'width',
                'height': 'height',
                'footer': 'footer',
                'top': 'top',
                'onclosed': 'onclosed',
                'hasCloseButton': 'hasCloseButton'
            };
            $.each(dataOptionsMapping, function (attributeName, optionName) {
                var value = options.button.data(attributeName);
                if (value) {
                    dataOptions[optionName] = value;
                }
            });
        }

        // Default options
        var settings = $.extend({}, $.confirm.options, {
            confirm: function () {
                var url = e && (('string' === typeof e && e) || (e.currentTarget && e.currentTarget.attributes['href'].value));
                if (url) {
                    if (options.post) {
                        var form = $('<form method="post" class="hide" action="' + url + '"></form>');
                        $("body").append(form);
                        form.submit();
                    } else {
                        window.location = url;
                    }
                }
            },
            cancel: function (o) {
            },
            button: null
        }, dataOptions, options);

        // Modal
        var modalHeader = '';
        if (settings.title !== '') {
            modalHeader =
                '<div class=modal-header>' +
                    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                    '<h4 class="modal-title">' + settings.title + '</h4>' +
                '</div>';
        }
        var modalHTML =
                '<div class="confirmation-modal modal fade" tabindex="-1" role="dialog"' +
        //(settings.width > 0 ? (' width="' + settings.width + '" ') : "") +
        //(settings.height > 0 ? (' height="' + settings.height + '" ') : "") +
                 '>' +

                    '<div class="modal-dialog" ' + (settings.width > 0 ? 'width="' + settings.width + '" ' : '') + (settings.height > 0 ? 'height="' + settings.height + '" ' : '') + '>' +
                        '<div class="modal-content alert-window">'
        if (settings.hasCloseButton) {
            modalHTML += '<a class="icon-remove pull-right cancel" data-dismiss="modal"></a>'
        }
        modalHTML += modalHeader +
        '<div class="modal-body" style="color: rgb(216, 244, 255); ">' + settings.text + '</div>';

        if (settings.footer) {
            modalHTML += '<div class="modal-footer">' +

        '<button class="confirm btn ' + settings.okButtonClass + '" type="button" data-dismiss="modal">' + settings.okButton + '</button>';

            if (!settings.alert) {
                modalHTML += '<button class="cancel btn ' + settings.cancelButtonClass + '" type="button" data-dismiss="modal">' + settings.cancelButton + '</button>'
            }
            modalHTML += '</div>';
        }
        modalHTML += '</div>' +
                       //    '</div>' +
                       //'</div>' +
                   '</div>';



        var modal = $(modalHTML);

        modal.on('shown.bs.modal', function () {
            $(document.body).addClass("modal-open");
            modal.find(".btn-primary:first").focus();
        });
        modal.on('hidden.bs.modal', function () {
            $(document.body).removeClass("modal-open");
            modal.remove();
        });
        modal.find(".confirm").click(function () {
            settings.confirm(settings.button);
        });
        modal.find(".cancel").click(function () {
            settings.cancel(settings.button);
        });
        modal.on('shown.bs.modal', function () {
            $(document.body).addClass("modal-open");
            modal.find(".btn-tenderblue:first").focus();
        });
        modal.on('hidden.bs.modal', function () {
            $(document.body).removeClass("modal-open");
            modal.remove();
            if (settings.onclosed)
                settings.onclosed();
        });

        if (settings.width > 0)
            modal.find(".modal-dialog").css("width", settings.width);



        if (settings.height > 0)
            modal.find(".modal-dialog").css("height", settings.height);

        if (settings.top > 0)
            modal.find(".modal-dialog").css("margin-top", settings.top + "px");


        // Show the modal
        modal.modal('show');
        $("body").append(modal);


        function getHeight(control) {

            if (!control.offsetHeight)
                return 0;
            if (control.offsetHeight > 0)
                return control.offsetHeight;
            return getHeight(control.firstChild);
        }
        setTimeout(function () {
            var height = getHeight(modal.find(".modal-dialog")[0]);

            if (settings.height < 0)
                if (height > document.documentElement.clientHeight)
                    modal.find(".modal-dialog").css("height", document.documentElement.clientHeight - 20);
            if (settings.top < 0) {
                var top = (document.documentElement.clientHeight - height) / 2
                modal.find(".modal-dialog").css("margin-top", top + "px");
            }

        }, 200)

        modal[0].onclick = function () {
            function getTopCallerArg(arg) {
                if (!arg.callee.caller)
                    return arg;
                return getTopCallerArg(arg.callee.caller.arguments);
            }

            try {
                if (!makeStop)
                    return;
                var evt = e || window.event || getTopCallerArg(arguments)[0];
                if (evt.stopPropagation) { //W3C��ֹð�ݷ���  
                    evt.stopPropagation();
                } else {
                    evt.cancelBubble = true; //IE��ֹð�ݷ���  
                }
                return false;
            }
            finally {
                makeStop = true;
            }
        }

    };

    /**
    * Globally definable rules
    */
    $.confirm.options = {
        text: "Error",
        title: "",
        okButton: "Yes",
        cancelButton: "Cancel",
        post: false,
        okButtonClass: "btn-primary",
        cancelButtonClass: "btn-default",
        hasCloseButton: false,
        alert: false,
        width: -1,
        height: -1,
        footer: true,
        top: "300",
        onclosed: null
    }
})(jQuery);
var makeStop = true;