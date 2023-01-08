/*
    "DOCUMENTATION"

    Before use you must connect a fetch function for the library to use:
        KA_API.connectFetch(require("node-fetch"));

    You can then use any of the following functions:
        getFullUserProfile
        getCombinedBadges
        getProfileWidgets
        isHellbanned
        avatarDataForProfile
        getPublicBadgesForProfiles
        profilePermissions
        homepageQueryV2
        discussionAvatar
        getFlag
        getLearnMenuProgress
        MyCoursesViaGateway
    each function can take 2 parameters. The first is an optional settings
    object for example:
        {
            variables: {
                username: "vxs"
            }
        }
    the second parameter is an optional callback parameter. Instead of using
    the callback parameter you can use use ".then()" notation

    If you want to make a request that isn't one of the above operations
    you can use the graphQL method and then specify your own operation:
        KA_API.graphQL({
            operation: "getFullUserProfile",
            variables: {
                username: "vxs"
            }
        })
    you can also specify your own query string
        KA_API.graphQL({
            operation: "getFullUserProfile",
            variables: {
                kaid: "kaid_1065213098995021368328526"
            },
            query: "getFullUserProfile($kaid: String, $username: String) {..."
        })

*/

const KA_API = {
    fetch_: null,
    connectFetch: f => {
        KA_API.fetch_ = f;
    },
    queryStrings: {
        getFullUserProfile: `getFullUserProfile($kaid: String, $username: String) {\\n  user(kaid: $kaid, username: $username) {\\n    id\\n    kaid\\n    key\\n    userId\\n    email\\n    username\\n    profileRoot\\n    gaUserId\\n    qualarooId\\n    isPhantom\\n    isDeveloper: hasPermission(name: \\\"can_do_what_only_admins_can_do\\\")\\n    isCurator: hasPermission(name: \\\"can_curate_tags\\\", scope: ANY_ON_CURRENT_LOCALE)\\n    isCreator: hasPermission(name: \\\"has_creator_role\\\", scope: ANY_ON_CURRENT_LOCALE)\\n    isPublisher: hasPermission(name: \\\"can_publish\\\", scope: ANY_ON_CURRENT_LOCALE)\\n    isModerator: hasPermission(name: \\\"can_moderate_users\\\", scope: GLOBAL)\\n    isParent\\n    isSatStudent\\n    isTeacher\\n    isDataCollectible\\n    isChild\\n    isOrphan\\n    isCoachingLoggedInUser\\n    canModifyCoaches\\n    nickname\\n    hideVisual\\n    joined\\n    points\\n    countVideosCompleted\\n    bio\\n    profile {\\n      accessLevel\\n      __typename\\n    }\\n    soundOn\\n    muteVideos\\n    showCaptions\\n    prefersReducedMotion\\n    noColorInVideos\\n    autocontinueOn\\n    newNotificationCount\\n    canHellban: hasPermission(name: \\\"can_ban_users\\\", scope: GLOBAL)\\n    canMessageUsers: hasPermission(name: \\\"can_send_moderator_messages\\\", scope: GLOBAL)\\n    isSelf: isActor\\n    hasStudents: hasCoachees\\n    hasClasses\\n    hasChildren\\n    hasCoach\\n    badgeCounts\\n    homepageUrl\\n    isMidsignupPhantom\\n    includesDistrictOwnedData\\n    canAccessDistrictsHomepage\\n    preferredKaLocale {\\n      id\\n      kaLocale\\n      status\\n      __typename\\n    }\\n    underAgeGate {\\n      parentEmail\\n      daysUntilCutoff\\n      approvalGivenAt\\n      __typename\\n    }\\n    authEmails\\n    signupDataIfUnverified {\\n      email\\n      emailBounced\\n      __typename\\n    }\\n    pendingEmailVerifications {\\n      email\\n      __typename\\n    }\\n    tosAccepted\\n    shouldShowAgeCheck\\n    __typename\\n  }\\n  actorIsImpersonatingUser\\n}\\n\"}`,
        
        avatarDataForProfile: `avatarDataForProfile($kaid: String!) {\\n  user(kaid: $kaid) {\\n    id\\n    avatar {\\n      name\\n      imageSrc\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n`,
        
        getCombinedBadges: `getCombinedBadges($kaid: String) {\\n  user(kaid: $kaid) {\\n    id\\n    badges {\\n      lastEarnedDate\\n      count\\n      badge {\\n        ...Badge\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n  allBadges(excludeFilters: [RETIRED, CUSTOM, HIDDEN_IF_UNKNOWN]) {\\n    ...Badge\\n    __typename\\n  }\\n}\\n\\nfragment Badge on Badge {\\n  badgeCategory\\n  description\\n  fullDescription\\n  isCustom\\n  isRetired\\n  name\\n  points\\n  absoluteUrl\\n  hideContext\\n  icons {\\n    smallUrl\\n    compactUrl\\n    emailUrl\\n    largeUrl\\n    __typename\\n  }\\n  relativeUrl\\n  slug\\n  __typename\\n}\\n`,
        
        getPublicBadgesForProfiles: `getPublicBadgesForProfiles($kaid: String) {\\n  user(kaid: $kaid) {\\n    id\\n    publicBadges {\\n      ...Badge\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment Badge on Badge {\\n  badgeCategory\\n  description\\n  fullDescription\\n  isCustom\\n  isRetired\\n  name\\n  points\\n  absoluteUrl\\n  hideContext\\n  icons {\\n    smallUrl\\n    compactUrl\\n    emailUrl\\n    largeUrl\\n    __typename\\n  }\\n  relativeUrl\\n  slug\\n  __typename\\n}\\n`,
        
        discussionAvatar: `discussionAvatar {\\n  user {\\n    id\\n    avatar {\\n      name\\n      imageSrc\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n`,
        
        isHellbanned: `isHellbanned($kaid: String!) {\\n  user(kaid: $kaid) {\\n    id\\n    discussionBanned\\n    __typename\\n  }\\n}\\n`,
        
        getProfileWidgets: `getProfileWidgets($kaid: String) {\\n  user(kaid: $kaid) {\\n    id\\n    profileWidgets {\\n      widgetId\\n      translatedTitle\\n      viewAllPath\\n      readAccessLevel\\n      readLevelOptions\\n      editSettings\\n      isEditable\\n      isEmpty\\n      ... on BadgeCountWidget {\\n        badgeCounts {\\n          count\\n          category\\n          compactIconSrc\\n          __typename\\n        }\\n        __typename\\n      }\\n      ... on DiscussionWidget {\\n        statistics {\\n          answers\\n          flags\\n          projectanswers\\n          projectquestions\\n          votes\\n          comments\\n          questions\\n          replies\\n          __typename\\n        }\\n        __typename\\n      }\\n      ... on ProgramsWidget {\\n        programs {\\n          authorNickname\\n          authorKaid\\n          key\\n          displayableSpinoffCount\\n          sumVotesIncremented\\n          imagePath\\n          translatedTitle\\n          url\\n          deleted\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n`,

        profilePermissions: `profilePermissions($kaid: String, $username: String) {\\n  user(kaid: $kaid, username: $username) {\\n    id\\n    isCoachListWritable\\n    isChildOfActor\\n    __typename\\n  }\\n}\\n`,

        homepageQueryV2: `homepageQueryV2($kaid: String, $username: String) {\\n  flag(name: \\\"lp_class_picker_via_gateway\\\") {\\n    id\\n    name\\n    isUserPassing\\n    __typename\\n  }\\n  user(kaid: $kaid, username: $username) {\\n    id\\n    kaid\\n    isActor\\n    isCoachedByActor\\n    isChildOfActor\\n    isManagedByActor\\n    canViewUserProgress: actorHasUserScopedPermission(capability: CAN_VIEW_USER_PROGRESS)\\n    canViewTeachersAndClassrooms: actorHasUserScopedPermission(capability: CAN_VIEW_TEACHERS_AND_CLASSROOMS)\\n    isDistrictSynced\\n    isKmapSynced\\n    homepageModules {\\n      navigation {\\n        myCoursesEnabled\\n        interestedInSat\\n        interestedInLsat\\n        classes {\\n          studentList {\\n            id\\n            descriptor\\n            cacheId\\n            name\\n            coach {\\n              id\\n              kaid\\n              __typename\\n            }\\n            signupCode\\n            __typename\\n          }\\n          showAssignments\\n          hasActiveAssignments\\n          hasKmapGoals\\n          hasCourseGoals\\n          isKmap\\n          isK4d\\n          isActive\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}`,
    
        getFlag: `getFlag($name: String!) {\\n  flag(name: $name) {\\n    id\\n    name\\n    isUserPassing\\n    __typename\\n  }\\n}\\n\"}`,

        getLearnMenuProgress: `getLearnMenuProgress($slugs: [String!]) {\\n  user {\\n    id\\n    subjectProgressesBySlug(slugs: $slugs) {\\n      topic {\\n        id\\n        slug\\n        __typename\\n      }\\n      currentMastery {\\n        percentage\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}`,

        MyCoursesViaGateway: `MyCoursesViaGateway {\\n  classPicker {\\n    enabled\\n    classesInGradeLevels {\\n      id\\n      subjects {\\n        id\\n        __typename\\n      }\\n      __typename\\n    }\\n    gradeLevelGroups {\\n      title\\n      levels {\\n        id\\n        title\\n        __typename\\n      }\\n      __typename\\n    }\\n    domains {\\n      slug\\n      title\\n      subjects {\\n        id\\n        key\\n        slug\\n        title: translatedTitle\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n  user {\\n    id\\n    selfSelectedGradeLevel\\n    districtGradeLevel\\n    cleverId\\n    isDistrictSynced\\n    classPickerSubjectProgresses {\\n      ...CourseProgress\\n      __typename\\n    }\\n    recentTopics(limit: 4) {\\n      id\\n      slug\\n      title: translatedTitle\\n      unit: parent {\\n        id\\n        title: translatedTitle\\n        thumbnailUrl: largeIconPath\\n        domain: domainSlug\\n        nodeUrl: relativeUrl\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment CourseProgress on SubjectProgress {\\n  topic {\\n    domainSlug\\n    iconPath\\n    id\\n    slug\\n    title: translatedTitle\\n    relativeUrl\\n    __typename\\n  }\\n  unitProgresses {\\n    lastWorkedOn\\n    currentMastery {\\n      percentage\\n      __typename\\n    }\\n    topic {\\n      id\\n      iconPath\\n      title: translatedTitle\\n      relativeUrl\\n      masteryEnabled\\n      subjectMasteryEnabled\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}\\n\"}`,
        
    },
    graphQL: function (dataIn = {}, callback) {
        if (!KA_API.fetch_) {
            console.error([
                "A fetch function has not been set for the KA_API wrapper to use.",
                "Try `KA_API.connectFetch(require('node-fetch'));`",
                "Make sure to run `npm install node-fetch@2`"
            ].join("\n"));
            return;
        }

        let queryStr = dataIn.query ? dataIn.query : this.queryStrings[dataIn.operation];

        return new Promise(resolve => {
            this.fetch_(
                "https://www.khanacademy.org/api/internal/graphql/" + dataIn.operation, 
                {
                    "method": "POST",
                    "headers": {
                        "content-type": "application/json",
                        "x-ka-fkey": dataIn["x-ka-fkey"] ?? "0"
                    },
                    "body": `{
                      "operationName": ${JSON.stringify(dataIn.operation)},
                      "variables": ${JSON.stringify(dataIn.variables)},
                      "query": "query ${queryStr}"
                    }`   
                }
            )
            .then(res => res.json())
            .then(json => {
                if (callback) callback(json.data);
                resolve(json.data);
            })
        });
    }
};

for (let prop in KA_API.queryStrings) {
    KA_API[prop] = (obj, callback) => {
        obj.operation = prop;
        return KA_API.graphQL(obj, callback);
    };
}

module.exports = KA_API;
