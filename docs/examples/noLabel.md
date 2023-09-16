---
title: No Label
---

# No Label

<script setup>
import {nolabel as config} from './basic';
</script>

<Chart
  :type="config.type"
  :options="config.options"
  :data="config.data"
/>

### Code

:::code-group

<<< ./basic.ts#nolabel [config]

<<< ./basic.ts#data [data]

:::
