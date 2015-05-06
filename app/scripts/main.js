'use strict';
(function($) {
    var router;

    //现在获得的可以抽奖的次数，在进入页面时可以通过xhr请求获取，或者从页面上的隐藏域中获取初始值。
    var aviableLotteryTimes = 2;
    // 翻拍游戏过关次数
    var clearMissionsCount = 0;
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
            // cards = _.shuffle(cards);

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

            $('#content').find('.card').velocity({ 
                rotateY: "+=180deg"
            },{ duration: 500 , easing: 'linear'});
            window.setTimeout(function(){
                $('#content').find('.card img').css('opacity', 0);
            }, 250);

            //$('#content').find('.card').toggleClass('face back');

            var currentFliped = null,
                lastFliped = null,
                disabled = false;

            var flip = function(card, force) {
                var state = card.data('flip-state') || 'back';
                if(state === 'back') {
                    card.velocity({ 
                        rotateY: "0deg"
                    },{ duration: 500, easing: 'linear' });
                    window.setTimeout(function(){
                        card.find('img').css('opacity', 1);
                    }, 250);
                    card.data('flip-state', 'face');
                } else {
                    if(force === true) {
                        card.velocity({ 
                            rotateY: "180deg"
                        },{ duration: 500, easing: 'linear' });
                        window.setTimeout(function(){
                            card.find('img').css('opacity', 0);
                        }, 250);
                        card.data('flip-state', 'back');
                    }
                }
            }

            var clear = function(card) {
                card.addClass('clear');
                card.velocity({ 
                    opacity: 0,
                    scaleX: 1.2,
                    scaleY: 1.2
                },{ duration: 1000});
            }

            $('#content').find('.card').on('click.flip', function() {
                //当翻到的两个牌不一样时，不允许再翻其他牌
                if (disabled || $(this).data('flip-state') === 'face') {
                    return;
                }
                flip($(this));

                // $(this).toggleClass('face back');
                currentFliped = $(this);

                if (_.isNull(lastFliped)) {
                    lastFliped = currentFliped;
                } else {
                    //翻到两张一样的牌
                    if (lastFliped.find('img.fg').attr('src') === currentFliped.find('img.fg').attr('src')) {
                        currentFliped.off('click.flip');
                        lastFliped.off('click.flip');
                        disabled = true;
                        window.setTimeout(function() {
                            clear(currentFliped);
                            clear(lastFliped);
                            currentFliped = null;
                            lastFliped = null;
                            disabled = false;
                            if ($('#content').find('.card.clear').length === 16) {
                                window.setTimeout(function() {
                                    _this.success();
                                }, 1000);
                            }
                        }, 500);
                    } else {
                        disabled = true;
                        window.setTimeout(function() {
                            flip(currentFliped, true);
                            flip(lastFliped, true);
                            currentFliped = null;
                            lastFliped = null;
                            disabled = false;
                        }, 1000);

                    }
                }
            });
        },
        success: function() {
            clearMissionsCount += 1;

            var winWidth = $(window).width();
            var elem = $($('#dialog-note').html());
            elem.find('#lottery-times').text(Number(aviableLotteryTimes) + clearMissionsCount * 2);
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

            //点击大转盘后，计算到目前为止获得的抽奖次数，必要的话向服务器发送请求，将值保存到服务器端。
            elem.find('#btn-turntable').on('click', function(e) {
                e.preventDefault();
                aviableLotteryTimes += clearMissionsCount * 2;
                noteDialog.close().remove();
                router.navigate('turntable', {trigger: true});
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
            $('#content').find('.turntable').height(winWidth);
            winWidth = $(window).width();
            $('#content').find('.turntable').width(winWidth - 20).height(winWidth - 20);

            $('#content').find('.turntable-pointer').on('click', function() {
                var turntablePointer = $(this);

                if(turntablePointer.data('rotating') === true) {
                    return;
                }

                //判断剩余的抽奖次数
                if(aviableLotteryTimes <= 0) {
                    dialogAlert('不能抽奖了，请继续玩翻牌游戏');
                    return;
                }

                turntablePointer.data('rotating', true);
                $('#content').find('.turntable').velocity({
                    translateZ: 0, //启用硬件加速
                    rotateZ: '0'
                },{duration: 0});
                //点击抽奖按钮，开始转动转盘，同时向服务器请求获取此处的中奖信息
                 $('#content').find('.turntable').velocity({
                    translateZ: 0, //启用硬件加速
                    rotateZ: '360deg'
                 },{
                    loop: true,
                    duration: 1000,
                    easing: 'linear'
                 });
                
                //模拟1s后获得服务器端中奖结果
                window.setTimeout(function() {
                    $('#content').find('.turntable').velocity('stop');
                    $('#content').find('.turntable').css('transform', 'rotateZ(0deg)')
                    //中奖结果以奖品id返回
                    //此处模拟最终结果，这里的id与初始化时奖品key一致
                    var resultId = _.sample([1, 2, 3, 4, 5, 6, 7, 8]);

                    aviableLotteryTimes -= 1;

                    var deg = _.random(_this.prizes[resultId].degRange[0] + 10, _this.prizes[resultId].degRange[1] - 10) + 1800;
                    $('#content').find('.turntable').velocity({
                        translateZ: 0, //启用硬件加速
                        rotateZ: deg + 'deg'
                    },{
                        duration: 10000,
                        easing: [0, .23, .27, .99],
                        complete: function(){
                            turntablePointer.data('rotating', false);

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
                        }
                    })
                }, 1000);


            });
        }
    };

    function dialogAlert(content) {
        var winWidth = $(window).width();
        var elem = $($("#dialog-alert").html());
        elem.find('p.content').html(content);
        var d = dialog({
            content: elem,
            skin: 'dialog-b',
            id: '',
            fixed: true
        });
        d.showModal().width(winWidth * 0.7);
        elem.find('#btnClose').on('click', function(){
            d.close().remove();
        });
    }

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
