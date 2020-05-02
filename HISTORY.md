## 1.1.0

* db/MongoBuilder
    - add EMPTY condition
    - fix column query for indexed result   
* db/MysqlBuilder
    - add EMPTY condition
    - add EXISTS condition
    - fix column query for indexed result   
    
## 1.0.0

* helper/ObjectHelper
    - replace keys in data map
* helper/NestedHelper
    - get whole array element by index
    - rename NestedValueHelper     
* i18n/I18n
    - swap translation arguments
* i18n/MessageSource
    - fix force translation by parent sources     
    
## 0.36.0

* db/MongoBuilder
    - fix NOT EQUAL condition for arrays 
* validator/StringValidator
    - add string trimming by default
    
## 0.35.1

* security/WebUser
    - fix custom return url

## 0.35.0

* base/Configuration
    - fix output configuration name from original module
* base/Controller
    - add web user to spawned objects
* behavior/TrimBehavior
    - remove whitespace from both string ends
* validator/RequireValidator
    - create option to trim empty value

## 0.34.0

* behavior/RelationChangeBehavior
    - unlink and delete by related models only
* db/ActiveRecord
    - fix implicit parameter passing to findById
* db/ActiveQuery
    - skip query with empty link value
* db/MongoDatabase
    - drop all tables
* helper/FileHelper
    - add copy children
    - add flags to copy method
* security/rbac/DatabaseRbacStore
    - parse JSON rule configuration
* validator/CheckboxValidator
    - add True and False value
* validator/RegexValidator
    - fix duration pattern
* validator/SpawnValidator
    - resolve BaseClass from string

## 0.33.0

* validator/ExistValidator
    - add string filter as attribute value filter
    
## 0.32.0

* base/Module
    - inject params from constructor
* db/ActiveRecord
    - fix unlink all via relation
* web/Router
    - add selector of all actions for request methods
    
## 0.31.0

* base/Controller
    - extract render only method
* base/Model
    - move label generation to string helper
    - unset multiple attributes
* base/Module
    - add relative module name
    - exclude app name from logs
    - forward configuration data from module constructor
* helper/ArrayHelper
    - rename diff to exclude
* helper/CommonHelper
    - set not required log prefix
* helper/MathHelper
    - fix Math.round, Math.ceil, Math.floor
* helper/ObjectHelper
    - refactor helpers of delete properties
* view/Theme
    - add view own model methods
* view/LocaleFileMap
    - place language folders on the first locale level
* web/Router
    - redirect to default module

## 0.30.0

* db/MongoDatabase
    - create table when creating index
* helper/ArrayHelper
    - fix hierarchy sorting
* helper/DateHelper
    - add duration parser
* helper/ObjectHelper
    - extract NestedHelper
* i18n/I18n
    - refactor translation
* security/Auth
    - prevent cross-site request forgery
* validator/StringValidator
    - validate by regular expression pattern
* view/ActionView
    - add locale templates including for source language

## 0.29.0

* base/Event
    - add once handler
    - detach all handlers
* db/Query
    - multiple arguments for logical operations
* i18n/MessageSource
    - async message load
* validator/FilterValidator
    - extract CheckboxValidator
    - extract JsonValidator

## 0.28.0

* db/Database
    - database components refactor
* i18n/FileMessageSource
    - file message source refactor
* log/Logger
    - logger refactor
    - extract ActionProfiler as component
* scheduler/Scheduler
    - append initialize method
* security/Auth
    - authentication components refactor

## 0.27.0

* db/ActiveLinker
    - extract as separate entity
* helper/QueryHelper
    - fix query with multiple nested relations
* i18n/I18n
    - resolve message source with module original
* scheduler/Scheduler
    - assign task module
* validator/SpawnValidator
    - validate spawn configuration JSON
* view/Theme
    - add isOrigin flag to template hierarchy
    - get closest ancestor template (to call from overwritten one)

## 0.26.0

* base/Configuration
    - show config file exception
* captcha/CaptchaAction
    - fix font configuration
* helper/FileHelper
    - promised file actions
* log/FileLogStore
    - non-blocking log rotation
* db/QueryBuilder
    - move query builders to base class

## 0.25.0

* base/Base
    - add spawn method to create instance with dependencies
* base/ClassMapper
    - add class dependencies to module configuration
* base/Module
    - add original to inherit all module functionality
* captcha/CaptchaAction
    - replace gm with sharp
* db/ActiveRecord
    - extend beforeSave with beforeInsert and beforeUpdate
    - extend afterSave with afterInsert and afterUpdate
* upgrade to Node.js 12

## 0.24.0

* base/Action
    - add controller's methods
* base/Controller
    - rename getBodyParam to getPostParam
* behavior/OrderBehavior
    - refactor update method
* db/MongoDriver
    - add unset and unsetAll commands
* db/Query
    - append getter methods
* validator/NumberValidator
    - fix validation method

## 0.23.0

* db/Query
    - extend select and addSelect methods to take array and string arguments
* helper/DateHelper
    - extract date methods to a separate class
* helper/MongoHelper
    - add array identifier checker