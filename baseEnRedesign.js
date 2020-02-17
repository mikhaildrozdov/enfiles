var baseEnRedesign = {
    gameId: 68085, 
    penaltyHandle: false,

    checkCodesEvailable: function(codes, prefix) {
        var self = this;

        $('#levelForm').submit(function() {
            var answer = $('#LevelAnswer').val().toString().trim();

            if (codes.indexOf(sha1.getSaltedSha1(answer)) !== -1) {
                $('#LevelAnswer').val(prefix + answer);
            }
        });
    },

    supportsHtml5Storage: function() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    },

    getItem: function(key) {
        if (!this.supportsHtml5Storage()) {
            return false;
        }

        return  localStorage.getItem(key + '_' + this.gameId);
    },
    
    setItem: function(key, value) {
        if (!this.supportsHtml5Storage()) {
            return;
        }

        localStorage.setItem(key + '_' + this.gameId, value);
    },

    clearItem: function(key, slug) {
        if (!this.supportsHtml5Storage()) {
            return;
        }

        if (slug) {
            storageSlug = this.getItem(slug);
        }

        if (!slug || !storageSlug) {
            localStorage.removeItem(key + '_' + this.gameId);

            if (slug) {
                this.setItem(slug, true);
            }
        }
    },

    init: function() {
        var self = this;

        if (deploy) {
            var $task = $('#tast-structure'),
                taskName = $task.find('.task-name').html(),
                taskBlock = $task.find('.task-block').html(),
                levelId = $('input[name="LevelId"]:not(#LevelId)').val(),
                LevelNumber = $('input[name="LevelNumber"]:not(#LevelNumber)').val();
                hints = [];

            $('.hint-block').each(function() {
                hints.push($(this).html());
            });
            
            if ($('#incorrect').length) {
                $('#error-message').removeClass('d-none');
                setTimeout(function() {$('#error-message').alert('close')}, 5000);
            }

            if ($('.color_correct:contains("Ответ или код")').length) {
                if(!self.penaltySubmited()) {
                    $('#success-message').removeClass('d-none');
                    setTimeout(function() {$('#success-message').alert('close')}, 5000);
                }
            }

            var hintTime = false,
                upTime = false;

            $('script:contains("StartCounter")').each(function() {
                var scriptText =$(this).html();

                if (scriptText) {
                    parseTime = scriptText.match(/\"StartCounter\":(\d+)/);
                    var time = parseInt(parseTime[1]);

                    if (!hintTime || hintTime > time) {
                        hintTime = time;
                    }

                    if (!upTime || upTime < time) {
                        upTime = time;
                    }
                }
            });

            if (hintTime === upTime) {
                hintTime = false;
            }

            $('head').html($('#head').html());
            $('body').html($('#body').html());
            $('#task-name').html(taskName);
            $('#task-block').html(taskBlock);
            $('#LevelId').val(levelId);
            $('#LevelNumber').val(LevelNumber);

            for (var i = 0; i < hints.length; i++) {
                $('#hints-block').append('<h5>Подсказка</h3>');
                $('#hints-block').append(hints[i]);
            }

            if (upTime > 0) {
                self.startUpTimer(upTime);
            }

            if (hintTime) {
                self.startHintTimer(hintTime);
            }

            $('html').css({display:'block'});   

            $('#tasks a').click(function() {
                self.changeTask($(this).attr('href'));
                return false;
            });

            self.initTeam();
            self.toogleNavbar();
            self.initTask();
            self.addSort();
        }
    },

    initTeam: function() {
        let userId = this.getItem('USER_ID');

        if (userId) {
            $('#team-identifier').css({'background-color': userId}).removeClass('d-none');
        }
    },

    toogleNavbar: function() {
        $(document).on('click', '.navbar-toggler, .navbar-brand', function() {
            $($(this).data('target')).toggleClass('show');
            return false;
        });
    },

    penaltySubmited: function() {
        if (this.penaltyHandle) {
            if (this.getItem(this.penaltyHandle)) {
                return false;
            } 

            this.setItem(this.penaltyHandle)

            return true;
        }

        return false;
    },

    startUpTimer: function(upTime) {
        var clock = $('.your-clock').FlipClock({
            countdown: true,
            autoStart: false
        });
        clock.setTime(upTime);
        clock.start();
        setTimeout(function() {window.location.reload();}, upTime * 1000);
    },

    startHintTimer: function(hintTime) {
        var self = this;
        $('#hint-timer').html(self.convertTime(hintTime));
        setInterval(
            function() {
                --hintTime;
                $('#hint-timer').html(self.convertTime(hintTime));
            },
            1000
        );
        $('#hint-timer-block').removeClass('d-none');
        setTimeout(function() {window.location.reload();}, hintTime * 1000);
    },

    changeTask: function(taskId) {
        $('#tasks').removeClass('show');
        this.setItem('taskId', taskId);
        $('#tasks a.active').removeClass('active');
        let newActiveTask = $('#tasks a[href="' + taskId + '"]');
        newActiveTask.addClass('active');
        $('.task').addClass('d-none');
        $(taskId).removeClass('d-none');

        if (newActiveTask.hasClass('completed')) {
            this.hideForm();
        } else {
            this.showForm();
        }

    },

    initTask: function() {
        var taskId = this.getItem('taskId');
           
        if (taskId) {
            this.changeTask(taskId);
        } else {
            if ($('#task-0').length) {
                this.changeTask('#task-0');
                this.hideForm();
            }
        }
    },

    addSort: function() {
        var levelSort = this.getSort();

        $('#tasks .orderable').each(function(index) {
            $(this).addClass('order-' + levelSort[index]);
        });
    },

    getSort: function() {
        var levelSort = this.getItem('sort');
            
        if (levelSort) { 
            levelSort = JSON.parse(levelSort);
        } else {
            levelSort = this.createNewSort(this.supportsHtml5Storage());
            if (levelSort) {
                this.setItem('sort', JSON.stringify(levelSort));
            }
        }

        return levelSort;
    },

    createNewSort: function(shufle) {
        var countLevels = $('#tasks .orderable').length;

        if (0 === countLevels) {
            return false;
        }

        var levelSort = [];

        for (var i = 0; i < countLevels; ++i) {
            levelSort[i] = i;
        };

        if (shufle) {
            for (var i = 0; i < countLevels; ++i) {
                var j = Math.floor(Math.random() * (countLevels - i)) + i; 
                temp = levelSort[i]; 
                levelSort[i] = levelSort[j]; 
                levelSort[j] = temp; 
            }
        } 

        return levelSort;
    },

    hideForm: function() {
        $('#levelForm').addClass('d-none');
    },

    showForm: function() {
        $('#levelForm').removeClass('d-none');
    },

    submitValue: function(value) {
        $('#LevelAnswer').val(value);
        $('#levelForm').submit();
    },

    convertTime: function(sec){
        var hours = Math.floor(sec / 3600);
        var minutes = Math.floor((sec - (hours * 3600)) / 60);
        var seconds = sec - (hours * 3600) - (minutes * 60);

        if (0 < hours < 10) {
            hours = "0" + hours;
        }

        if (minutes < 10) {
            minutes = "0" + minutes;
        }

        if (seconds < 10) {
            seconds = "0" + seconds;
        }

        return (hours ? hours+':' : '') + minutes + ':' + seconds;
    }
}

$(document).ready(function() {
    baseEnRedesign.init();
});
