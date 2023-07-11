---
title: Horizontal Scale (Reversed)
---

# Horizontal Scale (Reversed)

<script setup>
import {reverse as config} from './horizontal';
</script>

<Chart
  :type="config.type"
  :options="config.options"
  :data="config.data"
/>

### Code

:::code-group

<<< ./horizontal.ts#reverse [config]

<<< ./horizontal.ts#data [data]

:::
