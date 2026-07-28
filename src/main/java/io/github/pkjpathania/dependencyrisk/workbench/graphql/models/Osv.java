package io.github.pkjpathania.dependencyrisk.workbench.graphql.models;

import io.github.pkjpathania.dependencyrisk.util.GenUtil;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class Osv {
  private String osvId;
  private List<String> aliases;
  private String summary;
  private String details;
  private String publishedAt;
  private String modifiedAt;
  private String withdrawnAt;

  @Override
  public String toString() {
    return GenUtil.toJson(this);
  }
}
