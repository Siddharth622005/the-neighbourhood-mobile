import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { GuidedTourDialog } from "../../components/GuidedTourDialog";
import { useAuth } from "../../lib/AuthProvider";
import { computeAge, stageLabel } from "../../lib/childAge";
import * as communityDb from "../../lib/db/community";
import { COMMUNITY_TOPICS, CommunityTopic, Discussion, TOPIC_LABEL } from "../../lib/db/communityTypes";
import { markFirstRunComplete, markHomeCoachComplete } from "../../lib/firstRun";
import { colors, fonts, radius, spacing, typeScale } from "../../lib/theme";
import { useScreenFocus } from "../../lib/useScreenFocus";

export default function Community() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ guidedTour?: string; next?: string; step?: string }>();
  const { child } = useAuth();
  const age = child ? computeAge(child.date_of_birth) : null;
  const ageMonths = age?.totalMonths ?? 12;

  // See child/guide.tsx: only the focused screen on matching route with
  // the right step may show a tour dialog.
  const isFocused = useScreenFocus();
  const isCommunityRoute = pathname === "/community";
  const guidedTour = params.guidedTour === "1" && params.step === "1" && isFocused && isCommunityRoute;
  const tourNext = params.next === "milestones" ? "&next=milestones" : "";

  const skipGuidedTour = async () => {
    await Promise.all([markHomeCoachComplete(), markFirstRunComplete()]).catch(() => {});
    router.replace("/home");
  };

  const [selectedTopic, setSelectedTopic] = useState<CommunityTopic | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDiscussions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await communityDb.getDiscussionsForAge(ageMonths, selectedTopic);
      setDiscussions(data);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [ageMonths, selectedTopic]);

  useEffect(() => {
    void loadDiscussions();
  }, [loadDiscussions]);

  const filteredDiscussions = discussions.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.body.toLowerCase().includes(q) ||
      (item.expert_reply?.expert_name.toLowerCase().includes(q) ?? false)
    );
  });

  const handleToggleSave = async (id: string) => {
    const newSavedState = await communityDb.toggleSaveDiscussion(id);
    setDiscussions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, saved: newSavedState } : d))
    );
  };

  const childStageName = stageLabel(ageMonths);
  const ageContextText = age
    ? `Parents of ${age.label}-olds`
    : `Parents in ${childStageName}`;

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredDiscussions}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <Text style={styles.eyebrow}>COMMUNITY</Text>
            <Text style={styles.title}>Where parents share & connect</Text>
            <Text style={styles.subtitle}>
              No loud feeds, no algorithmic hype. Just real parents navigating the same stage.
            </Text>

            {/* Stage Context Hero Banner */}
            <View style={styles.stageBanner}>
              <View style={styles.stageBannerHeader}>
                <View style={styles.stageDot} />
                <Text style={styles.stageBannerTitle}>{ageContextText} are discussing</Text>
              </View>
              <Text style={styles.stageBannerSub}>
                Surfaced for {child?.name ?? "your child"}&apos;s stage ({age?.label ?? "this month"}).
              </Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <SearchIcon />
              <TextInput
                style={styles.searchInput}
                placeholder="Search topics, questions, advice…"
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>

            {/* Topic Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.topicScroll}
              contentContainerStyle={styles.topicContainer}
            >
              <Pressable
                onPress={() => setSelectedTopic("all")}
                style={[
                  styles.topicChip,
                  selectedTopic === "all" && styles.topicChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.topicChipText,
                    selectedTopic === "all" && styles.topicChipTextSelected,
                  ]}
                >
                  All Topics
                </Text>
              </Pressable>
              {COMMUNITY_TOPICS.map((topic) => {
                const isSelected = selectedTopic === topic;
                return (
                  <Pressable
                    key={topic}
                    onPress={() => setSelectedTopic(topic)}
                    style={[styles.topicChip, isSelected && styles.topicChipSelected]}
                  >
                    <Text
                      style={[
                        styles.topicChipText,
                        isSelected && styles.topicChipTextSelected,
                      ]}
                    >
                      {TOPIC_LABEL[topic]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionHeading}>
              {selectedTopic === "all"
                ? "Recent Discussions"
                : TOPIC_LABEL[selectedTopic]}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <DiscussionCard
            discussion={item}
            onPress={() => router.push(`/community/discussion?id=${item.id}`)}
            onSave={() => handleToggleSave(item.id)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator color={colors.warmTaupe} size="small" />
              <Text style={styles.emptyText}>Loading discussions for your stage…</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No discussions found</Text>
              <Text style={styles.emptyText}>
                Be the first parent to start a conversation in this topic.
              </Text>
            </View>
          )
        }
      />

      {/* Floating Ask Question Button */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push("/community/ask")}
        accessibilityRole="button"
        accessibilityLabel="Ask a Question"
      >
        <PlusIcon />
        <Text style={styles.fabText}>Ask a Question</Text>
      </Pressable>

      {guidedTour && (
        <GuidedTourDialog
          eyebrow="Community"
          focus="Find your people"
          title="You're not doing this alone."
          body="A space for real parent conversations and shared experiences, at your child's stage."
          step={1}
          total={5}
          primaryTitle="Continue"
          onPrimary={() => router.replace(`/ask?guidedTour=1&step=2${tourNext}`)}
          onSkip={skipGuidedTour}
        />
      )}
    </View>
  );
}

function DiscussionCard({
  discussion,
  onPress,
  onSave,
}: {
  discussion: Discussion;
  onPress: () => void;
  onSave: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.cardHeader}>
        <View style={styles.cardTagRow}>
          <Text style={styles.cardTopic}>{TOPIC_LABEL[discussion.topic].toUpperCase()}</Text>
          <Text style={styles.cardAgeTag}>{discussion.author_child_age_months}m stage</Text>
        </View>

        <Pressable onPress={onSave} hitSlop={10} accessibilityLabel="Save discussion">
          <BookmarkIcon saved={!!discussion.saved} />
        </Pressable>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {discussion.title}
      </Text>
      <Text style={styles.cardBody} numberOfLines={2}>
        {discussion.body}
      </Text>

      {/* Expert Preview Badge if available */}
      {discussion.expert_reply && (
        <View style={styles.expertPreview}>
          <View style={styles.expertHeader}>
            <DoctorBadgeIcon />
            <Text style={styles.expertName}>
              {discussion.expert_reply.expert_name} ·{" "}
              <Text style={styles.expertCred}>{discussion.expert_reply.credential}</Text>
            </Text>
          </View>
          <Text style={styles.expertSnippet} numberOfLines={2}>
            &ldquo;{discussion.expert_reply.body}&rdquo;
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.authorBadge}>
          <View style={styles.authorCircle}>
            <Text style={styles.authorInitial}>{discussion.author_initial}</Text>
          </View>
          <Text style={styles.authorMeta}>
            Parent of {discussion.author_child_age_months}m old · {discussion.created_at}
          </Text>
        </View>

        <View style={styles.replyCountBadge}>
          <MessageIcon />
          <Text style={styles.replyCountText}>{discussion.reply_count} replies</Text>
        </View>
      </View>
    </Pressable>
  );
}

// Icons
function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        stroke={colors.textMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4.5v15m7.5-7.5h-15"
        stroke={colors.white}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BookmarkIcon({ saved }: { saved: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill={saved ? colors.warmTaupe : "none"}>
      <Path
        d="M17.5 21l-5.5-3.5L6.5 21V5a2 2 0 012-2h7a2 2 0 012 2v16z"
        stroke={colors.warmTaupe}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MessageIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21a9 9 0 10-4.5-1.2L3 21l1.2-4.5A9 9 0 0012 21z"
        stroke={colors.textMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DoctorBadgeIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke={colors.sage}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + 40,
  },
  headerArea: {
    marginBottom: spacing.md,
  },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.5,
    color: colors.warmTaupe,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h1,
    color: colors.charcoal,
    lineHeight: typeScale.h1 * 1.2,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.45,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  // Stage Banner
  stageBanner: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: "rgba(139, 115, 85, 0.08)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(139, 115, 85, 0.14)",
  },
  stageBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  stageDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.sage,
  },
  stageBannerTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  stageBannerSub: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Search Bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
    padding: 0,
  },

  // Topic Filters
  topicScroll: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  topicContainer: {
    gap: spacing.xs + 2,
    paddingRight: spacing.md,
  },
  topicChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topicChipSelected: {
    backgroundColor: colors.warmTaupe,
    borderColor: colors.warmTaupe,
  },
  topicChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption + 1,
    color: colors.textMuted,
  },
  topicChipTextSelected: {
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
  },

  sectionHeading: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h3,
    color: colors.charcoal,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  // Discussion Card
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs + 2,
  },
  cardTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTopic: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.warmTaupe,
  },
  cardAgeTag: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    color: colors.textMuted,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.3,
    color: colors.charcoal,
  },
  cardBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.45,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Expert Preview
  expertPreview: {
    backgroundColor: "rgba(168, 181, 164, 0.12)",
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.sage,
  },
  expertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  expertName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    color: colors.charcoal,
  },
  expertCred: {
    fontFamily: fonts.body,
    color: colors.warmTaupe,
  },
  expertSnippet: {
    fontFamily: fonts.serifItalic,
    fontSize: typeScale.caption + 1,
    lineHeight: (typeScale.caption + 1) * 1.4,
    color: colors.charcoal,
    marginTop: 3,
  },

  // Card Footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: "rgba(96, 79, 60, 0.08)",
  },
  authorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  authorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(139, 115, 85, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  authorInitial: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.warmTaupe,
  },
  authorMeta: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.textMuted,
  },
  replyCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  replyCountText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    color: colors.textMuted,
  },

  // Empty State
  emptyWrap: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.body,
    color: colors.charcoal,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 4,
  },

  // FAB
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.charcoal,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.pill,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.white,
  },
});
