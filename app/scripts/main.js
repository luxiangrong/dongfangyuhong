'use strict';
(function($) {
    var router;

    /**
     * 翻牌游戏
     * @param {[type]} cards [初始化卡片的图片数组]
     */
    function FlipGame(cards) {
        this.cards = cards;
    }
    FlipGame.prototype = {
        //初始化翻牌游戏
        init: function(selector) {
            var _this = this;
            var seconds = 3;
            var cards = this.cards.concat(this.cards);
            cards = _.shuffle(cards);

            var gameView = $($(selector).html());

            gameView.find('img.fg').each(function(i, item) {
                $(this).attr('src', cards[i]);
            });

            $('#content').html(gameView);

            var countDown = function() {
                $('#content').find('.count-down .second').html(seconds);
                if (seconds === 0) {
                    _this.start();
                } else {
                    seconds--;
                    window.setTimeout(countDown, 1000);
                }
            };
            countDown();
        },
        start: function() {
            var _this = this;

            $('#content').find('.count-down').html('游戏开始');
            $('#content').find('.card').toggleClass('face back');

            var currentFliped = null,
                lastFliped = null,
                disabled = false;

            $('#content').find('.card').on('click.flip', function() {
                //当翻到的两个牌不一样时，不允许再翻其他牌
                if (disabled) {
                    return;
                }
                $(this).toggleClass('face back');
                currentFliped = $(this);

                if (_.isNull(lastFliped)) {
                    lastFliped = currentFliped;
                } else {
                    //翻到两张一样的牌
                    if (lastFliped.find('img.fg').attr('src') === currentFliped.find('img.fg').attr('src')) {
                        currentFliped.off('click.flip');
                        lastFliped.off('click.flip');
                        currentFliped.addClass('clear');
                        lastFliped.addClass('clear');
                        currentFliped = null;
                        lastFliped = null;
                        if ($('#content').find('.card.clear').length === 16) {
                            window.setTimeout(function() {
                                _this.success();
                            }, 1000);
                        }
                    } else {
                        disabled = true;
                        window.setTimeout(function() {
                            currentFliped.toggleClass('face back');
                            lastFliped.toggleClass('face back');
                            currentFliped = null;
                            lastFliped = null;
                            disabled = false;
                        }, 1000);

                    }
                }
            });
        },
        success: function() {
            var winWidth = $(window).width();
            var elem = $($('#dialog-note').html());
            var noteDialog = dialog({
                content: elem,
                skin: 'dialog-a',
                fixed: true
            });
            noteDialog.showModal().width(winWidth * 0.6);
            $('.ui-popup-backdrop').addClass('note-modal-bg');

            elem.find('#btn-flipcard').on('click', function() {
                noteDialog.close().remove();
                Backbone.history.loadUrl(Backbone.history.fragment);
            });
            elem.find('#btn-turntable').on('click', function() {
                noteDialog.close().remove();
            });
        }
    };

    /**
     * 大转盘游戏
     * @param {[type]} prizes [description]
     */
    function Turntable(prizes) {
        this.prizes = prizes;
    }
    Turntable.prototype = {
        init: function(selector) {
            var _this = this;
            $('#content').html($($(selector).html()));

            var index = 0;
            _.map(this.prizes, function(prize, key) {
                $('#content').find('.turntable-item').eq(index).find('h5').html(prize.label);
                $('#content').find('.turntable-item').eq(index).find('img').html(prize.pic);
                $('#content').find('.turntable-item').eq(index).addClass(prize.cssClass);
                index++;
            });

            var winWidth = $(window).width();
            $('#content').find('.turntable').width(winWidth - 20).height(winWidth - 20);

            $('#content').find('.turntable-pointer').on('click', function() {
                //点击抽奖按钮，开始转动转盘，同时向服务器请求获取此处的中奖信息
                $('#content').find('.turntable').removeClass('transition');
                $('#content').find('.turntable').css('transform', 'rotateZ(0deg)')
                $('#content').find('.turntable').css('-webkit-transform', 'rotateZ(0deg)')
                    // $('#content').find('.turntable').addClass('rotating');
                    //$.get('');
                    //
                    //模拟1s后获得服务器端中奖结果
                window.setTimeout(function() {
                    $('#content').find('.turntable').removeClass('rotating');
                    $('#content').find('.turntable').css('transform', 'rotateZ(0deg)')
                    $('#content').find('.turntable').css('-webkit-transform', 'rotateZ(0deg)')
                        //中奖结果以奖品id返回
                        //此处模拟最终结果，这里的id与初始化时奖品key一致
                    var resultId = _.sample([1, 2, 3, 4, 5, 6, 7, 8]);

                    var deg = _.random(_this.prizes[resultId].degRange[0] + 10, _this.prizes[resultId].degRange[1] - 10) + 1800;
                    $('#content').find('.turntable').addClass('transition');
                    // $('.turntable').addClass('rotating-to-stop');
                    $('#content').find('.turntable').css('transform', 'rotateZ(' + deg + 'deg)')
                    $('#content').find('.turntable').css('-webkit-transform', 'rotateZ(' + deg + 'deg)')
                    $('#content').find('.turntable').one('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd',
                        function() {
                            var elem = $($("#dialog-winning").html());
                            elem.find('h3 .prize').html(_this.prizes[resultId].label);
                            var dialogForm = dialog({
					            content: elem,
					            skin: 'dialog-b',
					            id: '',
					            fixed: true
					        });
					        dialogForm.showModal().width(winWidth * 0.7);

					        //点击提交        
					        elem.find('#btnSubmit').on('click', function(){

					        	//成功后触发下面的代码
					        	//
					        	dialogForm.close().remove();
					        	var elem = $($("#dialog-submit").html());
					        	var dialogFormResult = dialog({
						            content: elem,
						            skin: 'dialog-b',
						            id: '',
						            fixed: true
						        })
						        dialogFormResult.showModal().width(winWidth * 0.7);

						        elem.find('#btnClose').on('click', function(){
						        	dialogFormResult.close().remove();
						        });
					        });
                        });
                }, 500);


            });
        }
    };

    $(document).ready(function() {
        $('.card').on('click', function() {
            $(this).toggleClass('face back');
        });

        var AppRouter = Backbone.Router.extend({
            routes: {
                '': 'home',
                'flipcard': 'flipcard',
                'turntable': 'turntable',
                '*error': 'renderError'
            },
            home: function() {
                $('#content').html($('#template-home').html());
            },
            flipcard: function() {
                //实际使用时通过ajax从服务端获取图片列表
                console.log('开始翻牌');
                var flipGame = new FlipGame(['images/card01.jpg', 'images/card02.jpg', 'images/card03.jpg', 'images/card04.jpg', 'images/card05.jpg', 'images/card06.jpg', 'images/card07.jpg', 'images/card08.jpg']);
                flipGame.init('#template-flip-game');
            },
            turntable: function() {
                var turntable = new Turntable({
                    1: {
                        label: '<strong>一</strong>等奖',
                        pic: 'images/jiangpin01.png',
                        cssClass: 'turntable-item-1',
                        degRange: [315, 360]
                    },
                    2: {
                        label: '<strong>二</strong>等奖',
                        pic: 'images/jiangpin01.png',
                        cssClass: 'turntable-item-2',
                        degRange: [270, 315]
                    },
                    3: {
                        label: '<strong>三</strong>等奖',
                        pic: 'images/jiangpin01.png',
                        cssClass: 'turntable-item-3',
                        degRange: [225, 270]
                    },
                    4: {
                        label: '<strong>四</strong>等奖',
                        pic: 'images/jiangpin01.png',
                        cssClass: 'turntable-item-4',
                        degRange: [180, 225]
                    },
                    5: {
                        label: '<strong>五</strong>等奖',
                        pic: 'images/jiangpin01.png',
                        cssClass: 'turntable-item-5',
                        degRange: [135, 180]
                    },
                    6: {
                        label: '<strong>六</strong>等奖',
                        pic: 'images/jiangpin01.png',
                        cssClass: 'turntable-item-6',
                        degRange: [90, 135]
                    },
                    7: {
                        label: '<strong>七</strong>等奖',
                        pic: 'images/jiangpin01.png',
                        cssClass: 'turntable-item-7',
                        degRange: [45, 90]
                    },
                    8: {
                        label: '谢谢参与',
                        pic: 'images/jiangpin01.png',
                        cssClass: 'turntable-item-8',
                        degRange: [0, 45]
                    }
                });
                turntable.init('#template-turntable');
            },
            renderError: function(error) {
                console.log('URL错误, 错误信息: ' + error);
            }
        });

        router = new AppRouter();
        Backbone.history.start();

    });
})(jQuery);
