---
title: End Hierarchy
---

# End Hierarchy

<script setup>
import {config} from './endHierarchy';
</script>

<Chart
  :type="config.type"
  :options="config.options"
  :data="config.data"
/>

### Code

:::code-group

<<< ./endHierarchy.ts#config [config]

<<< ./endHierarchy.ts#data [data]

:::
