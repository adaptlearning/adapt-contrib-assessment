define([
    'coreJS/adapt'
], function(Adapt) {

    /*
        Here we setup a registry for all assessments
    */

    var assessmentsConfigDefaults = {
        "_postTotalScoreToLms": true,
        "_isPercentageBased": true,
        "_scoreToPass": 100,
        "_requireAssessmentPassed": false,
        "_isDefaultsLoaded": true
    };

    Adapt.assessment = _.extend({

    //Private functions

        _assessments: _.extend([], {
            _byPageId: {},
            _byAssessmentId: {}
        }),

        initialize: function() {
            this.listenTo(Adapt, "assessments:complete", this._onAssessmentsComplete);
            this.listenTo(Adapt, "router:location", this._checkResetAssessmentsOnRevisit);
        },

        _onAssessmentsComplete: function(state) {
            var assessmentId = state.id;

            state.isComplete = true;

            if (assessmentId === undefined) return;

            if (!this._getStateByAssessmentId(assessmentId)) {
                console.warn("assessments: state was not registered when assessment was created");
            }

            this.saveState();

            this._setPageProgress();

            this._checkAssessmentsComplete();

            //need to add spoor assessment state saving

        },

        _restoreModelState: function(assessmentModel) {

            if (!this._saveStateModel) {
                this._saveStateModel = Adapt.offlineStorage.get("assessment");
            }
            if (this._saveStateModel) {
                var state = assessmentModel.getState();
                if (this._saveStateModel[state.id]) {
                    assessmentModel.setRestoreState(this._saveStateModel[state.id]);
                }
            }

        },

        _checkResetAssessmentsOnRevisit: function(toObject) {
            /* 
                Here we hijack router:location to reorganise the assessment blocks 
                this must happen before trickle listens to block completion
            */
            if (toObject._contentType !== "page") return;

            //initialize assessment on page visit before pageView:preRender (and trickle)
            var pageAssessmentModels = this._getAssessmentByPageId(toObject._currentId);
            if (pageAssessmentModels === undefined) return;

            for (var i = 0, l = pageAssessmentModels.length; i < l; i++) {
                var pageAssessmentModel = pageAssessmentModels[i];
                pageAssessmentModel.reset();
            }

            this._setPageProgress();
        },

        _checkAssessmentsComplete: function() {
            var allAssessmentsComplete = true;
            var assessmentToPostBack = 0;
            var states = this._getStatesByAssessmentId();

            var assessmentStates = [];

            for (var id in states) {
                var state = states[id];
                if (!state.includeInTotalScore) continue;
                if (!state.isComplete) {
                    allAssessmentsComplete = false;
                    break;
                }
                assessmentToPostBack++;
                assessmentStates.push(state);
            }

            if (!allAssessmentsComplete || assessmentToPostBack === 0) return false;

            if (assessmentToPostBack === 1) {
                this._setupSingleAssessmentConfiguration(assessmentStates[0]);
            }

            this._postScoreToLms();

            return true;
        },

        _setupSingleAssessmentConfiguration: function(assessmentState) {
            var assessmentsConfig = Adapt.course.get("_assessment");
            $.extend(true, assessmentsConfig, {
                "_postTotalScoreToLms": assessmentState.includeInTotalScore,
                "_isPercentageBased": assessmentState.isPercentageBased,
                "_scoreToPass": assessmentState.scoreToPass
            });
            Adapt.course.set("_assessment", assessmentsConfig);
        },
        
        _postScoreToLms: function() {
            var assessmentsConfig = this.getConfig();
            if (assessmentsConfig._postTotalScoreToLms === false) return;
            
            var completionState = this.getState();
            //post completion to spoor
            _.defer(function() {
                Adapt.trigger("assessment:complete", completionState);
            });
        },

        _getAssessmentByPageId: function(pageId) {
            return this._assessments._byPageId[pageId];
        },

        _getStateByAssessmentId: function(assessmentId) {
            return this._assessments._byAssessmentId[assessmentId].getState();
        },

        _getStatesByAssessmentId: function() {
            var states = {};
            for (var i = 0, l = this._assessments.length; i < l; i++) {
                var assessmentModel = this._assessments[i];
                var state = assessmentModel.getState();
                states[state.id] = state;
            }
            return states;
        },

        _setPageProgress: function() {
            //set _subProgressTotal and _subProgressComplete on pages that have assessment progress indicator requirements
            
            var requireAssessmentPassed = this.getConfig()._requireAssessmentPassed;

            for (var k in this._assessments._byPageId) {

                var assessments = this._assessments._byPageId[k];

                var assessmentsTotal = assessments.length;
                var assessmentsPassed = 0;

                for (var i = 0, l = assessments.length; i < l; i++) {
                    var assessmentState = assessments[i].getState();

                    var isComplete;

                    if (requireAssessmentPassed) {
                        
                        if (!assessmentState.includeInTotalScore) {
                            isComplete = assessmentState.isComplete;
                        } else if (assessmentState.isPass) {
                            isComplete = assessmentState.isComplete;
                        }

                    } else {

                        isComplete = assessmentState.isComplete;
                    }

                    if ( isComplete ) {
                        assessmentsPassed+=1; 
                    }
                }

                try {
                    var pageModel = Adapt.findById(k);
                    pageModel.set("_subProgressTotal", assessmentsTotal);
                    pageModel.set("_subProgressComplete", assessmentsPassed);
                } catch(e) {

                }

            }
        },


    //Public functions

        register: function(assessmentModel) {
            var state = assessmentModel.getState();
            var assessmentId = state.id;
            var pageId = state.pageId;

            if (this._assessments._byPageId[pageId] === undefined) {
                this._assessments._byPageId[pageId] = [];
            }
            this._assessments._byPageId[pageId].push(assessmentModel);

            if (assessmentId) {
                this._assessments._byAssessmentId[assessmentId] = assessmentModel;
            }

            this._assessments.push(assessmentModel);

            this._restoreModelState(assessmentModel);

            Adapt.trigger("assessments:register", state, assessmentModel);

            this._setPageProgress();
        },

        get: function(id) {
            if (id === undefined) {
                return this._assessments.slice(0);
            } else {
                return this._assessments._byAssessmentId[id];
            }
        },

        saveState: function() {

            this._saveStateModel = {};
            for (var i = 0, assessmentModel; assessmentModel = this._assessments[i++];) {
                var state = assessmentModel.getState();
                this._saveStateModel[state.id] = assessmentModel.getSaveState();
            }

            Adapt.offlineStorage.set("assessment", this._saveStateModel);
        },

        getConfig: function () {
            var assessmentsConfig = Adapt.course.get("_assessment");

            if (assessmentsConfig && assessmentsConfig._isDefaultLoaded) {
                return assessmentsConfig;
            }

            if (assessmentsConfig === undefined) {
                assessmentsConfig = $.extend(true, {}, assessmentsConfigDefaults);
            } else {
                assessmentsConfig = $.extend(true, {}, assessmentsConfigDefaults, assessmentsConfig);
            }

            Adapt.course.set("_assessment", assessmentsConfig);

            return assessmentsConfig;
        },
        
        getState: function() {
            var assessmentsConfig = this.getConfig();

            var score = 0;
            var maxScore = 0;
            var isPass = false;
            var totalAssessments = 0;

            var states = this._getStatesByAssessmentId();

            var assessmentsComplete = 0;

            for (var id in states) {
                var state = states[id];
                if (!state.includeInTotalScore) continue;
                if (state.isComplete) assessmentsComplete++;
                totalAssessments++;
                maxScore += state.maxScore / state.assessmentWeight;
                score += state.score / state.assessmentWeight;
                isPass = isPass === false ? false : state.isPass;
            }

            var isComplete = assessmentsComplete == totalAssessments;
            
            var scoreAsPercent = Math.round((score / maxScore) * 100);

            if ((assessmentsConfig._scoreToPass || 100) && isComplete) {
                if (assessmentsConfig._isPercentageBased || true) {
                    if (scoreAsPercent >= assessmentsConfig._scoreToPass) isPass = true;
                } else {
                    if (score >= assessmentsConfig._scoreToPass) isPass = true;
                }
            }

            return {
                isComplete: isComplete,
                isPercentageBased: assessmentsConfig._isPercentageBased,
                requireAssessmentPassed: assessmentsConfig._requireAssessmentPassed,
                isPass: isPass,
                scoreAsPercent: scoreAsPercent,
                maxScore: maxScore,
                score: score,
                assessmentsComplete: assessmentsComplete,
                assessments: totalAssessments
            };
        },

    }, Backbone.Events);

    Adapt.assessment.initialize();

});
