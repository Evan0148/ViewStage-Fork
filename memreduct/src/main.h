// Mem Reduct 鈥?ViewStage Memory Cleaner Subprocess
// Copyright (c) 2011-2025 Henry++

#pragma once

#include "routine.h"
#include "resource.h"
#include "app.h"

// memory cleaning mask
#define REDUCT_WORKING_SET            0x01
#define REDUCT_SYSTEM_FILE_CACHE      0x02
#define REDUCT_STANDBY_PRIORITY0_LIST 0x04
#define REDUCT_STANDBY_LIST           0x08
#define REDUCT_MODIFIED_LIST          0x10
#define REDUCT_COMBINE_MEMORY_LISTS   0x20
#define REDUCT_REGISTRY_CACHE         0x40
#define REDUCT_MODIFIED_FILE_CACHE    0x80

// memory cleaning presets
#define REDUCT_MASK_ALL (REDUCT_WORKING_SET | \
                         REDUCT_SYSTEM_FILE_CACHE | \
                         REDUCT_STANDBY_PRIORITY0_LIST | \
                         REDUCT_STANDBY_LIST | \
                         REDUCT_MODIFIED_LIST | \
                         REDUCT_COMBINE_MEMORY_LISTS | \
                         REDUCT_REGISTRY_CACHE | \
                         REDUCT_MODIFIED_FILE_CACHE)

#define REDUCT_MASK_DEFAULT (REDUCT_WORKING_SET | \
                             REDUCT_SYSTEM_FILE_CACHE | \
                             REDUCT_STANDBY_PRIORITY0_LIST | \
                             REDUCT_REGISTRY_CACHE | \
                             REDUCT_COMBINE_MEMORY_LISTS | \
                             REDUCT_MODIFIED_FILE_CACHE)

#define REDUCT_MASK_FREEZES (REDUCT_STANDBY_LIST | REDUCT_MODIFIED_LIST)

#define DEFAULT_AUTOREDUCT_VAL 90
#define DEFAULT_AUTOREDUCTINTERVAL_VAL 30

#define DEFAULT_DANGER_LEVEL 90
#define DEFAULT_WARNING_LEVEL 70


